import { Command, EditorState, Transaction } from "prosemirror-state";
import {
  DecorationSet,
  DirectEditorProps,
  EditorView as EditorViewT,
} from "prosemirror-view";
import React, {
  DetailedHTMLProps,
  ForwardRefExoticComponent,
  HTMLAttributes,
  MutableRefObject,
  RefAttributes,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { EditorViewContext } from "../contexts/EditorViewContext.js";
import { LayoutGroup } from "../contexts/LayoutGroup.js";
import { NodeViewContext } from "../contexts/NodeViewContext.js";
import { NodeViewDesc, ViewDesc } from "../descriptors/ViewDesc.js";
import { useContentEditable } from "../hooks/useContentEditable.js";
import { useSyncSelection } from "../hooks/useSyncSelection.js";
import { usePluginViews } from "../hooks/useViewPlugins.js";
import { DecorationSourceInternal } from "../prosemirror-internal/DecorationInternal.js";
import { EditorViewInternal } from "../prosemirror-internal/EditorViewInternal.js";
import * as browser from "../prosemirror-internal/browser.js";
import {
  DOMNode,
  deepActiveElement,
  safariShadowSelectionRange,
} from "../prosemirror-internal/dom.js";
import {
  coordsAtPos,
  endOfTextblock,
  posAtCoords,
} from "../prosemirror-internal/domcoords.js";
import { DOMObserver } from "../prosemirror-internal/domobserver.js";
import { InputState } from "../prosemirror-internal/input.js";

import { DocNodeView } from "./DocNodeView.js";
import { NodeViewComponentProps } from "./NodeViewComponentProps.js";

type EditorStateProps =
  | {
      state: EditorState;
      defaultState?: never;
    }
  | {
      state?: never;
      defaultState: EditorState;
    };

export type EditorProps = Omit<
  DirectEditorProps,
  "state" | "nodeViews" | "decorations" | "dispatchTransaction"
> &
  EditorStateProps & {
    keymap?: { [key: string]: Command };
    nodeViews?: {
      [nodeType: string]: ForwardRefExoticComponent<
        NodeViewComponentProps & RefAttributes<HTMLElement>
      >;
    };
    decorations?: DecorationSet;
    dispatchTransaction?: (this: EditorViewT, tr: Transaction) => void;
  };

export type Props = EditorProps &
  DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;

export function EditorView(props: Props) {
  const {
    children,
    editable: editableProp,
    // keymap = {},
    nodeViews = {},
    dispatchTransaction: dispatchProp,
    decorations = DecorationSet.empty,
    defaultState,
    state: stateProp,
    handleDOMEvents,
    handleKeyDown,
    handleKeyPress,
    handleTextInput,
    handleClick,
    handleClickOn,
    handleDoubleClick,
    handleDoubleClickOn,
    handleDrop,
    handlePaste,
    handleScrollToSelection,
    handleTripleClick,
    handleTripleClickOn,
    plugins = [],
    ...mountProps
  } = props;

  const [internalState, setInternalState] = useState<EditorState | null>(
    defaultState ?? null
  );

  const posToDesc = useRef(new Map<number, ViewDesc>());
  posToDesc.current = new Map();
  const domToDesc = useRef(new Map<DOMNode, ViewDesc>());
  domToDesc.current = new Map();

  // We always set internalState above if there's no state prop
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const state = stateProp ?? internalState!;

  const mountRef = useRef<HTMLDivElement | null>(null);

  const editable = editableProp ? editableProp(state) : true;

  const editorViewRefInternal = useRef<EditorViewInternal | null>(null);

  // This is only safe to use in effects/layout effects or
  // event handlers!
  const editorViewAPI: EditorViewInternal = useMemo<EditorViewInternal>(() => {
    // @ts-expect-error - EditorView API not fully implemented yet
    const api: EditorViewInternal = {
      /* Start TODO */
      dragging: null,
      composing: false,
      focus() {
        /* */
      },
      // I do not know what this is or what it's for yet
      cursorWrapper: editorViewRefInternal.current?.cursorWrapper ?? null,
      /* End TODO */
      _props: {
        handleDOMEvents,
        handleClick,
        handleClickOn,
        handleDoubleClick,
        handleDoubleClickOn,
        handleDrop,
        handleKeyDown,
        handleKeyPress,
        handlePaste,
        handleScrollToSelection,
        handleTextInput,
        handleTripleClick,
        handleTripleClickOn,
      },
      focused: editorViewRefInternal.current?.focused ?? false,
      markCursor: editorViewRefInternal.current?.markCursor ?? null,
      input: editorViewRefInternal.current?.input ?? new InputState(),
      domObserver:
        editorViewRefInternal.current?.domObserver ??
        new DOMObserver(editorViewRefInternal),
      lastSelectedViewDesc: editorViewRefInternal.current?.lastSelectedViewDesc,
      get dom() {
        if (!mountRef.current) {
          throw new Error(
            "The EditorView should only be accessed in an effect or event handler."
          );
        }
        return mountRef.current;
      },
      get docView() {
        if (!mountRef.current || !domToDesc.current.get(mountRef.current)) {
          throw new Error(
            "The EditorView should only be accessed in an effect or event handler."
          );
        }
        return domToDesc.current.get(mountRef.current) as NodeViewDesc;
      },
      editable,
      state,
      updateState(state) {
        setInternalState(state);
      },
      dispatch(tr) {
        if (dispatchProp) {
          dispatchProp.call(this, tr);
        } else {
          this.updateState(this.state.apply(tr));
        }
      },
      someProp<PropName extends keyof EditorProps, Result>(
        propName: PropName,
        f?: (value: NonNullable<EditorProps[PropName]>) => Result
      ): Result | undefined {
        const prop = this["_props"][propName];
        if (prop != null) {
          return f ? f(prop) : prop;
        }
        for (const plugin of plugins) {
          const prop = plugin.props[propName as keyof typeof plugin.props];
          if (prop != null) {
            return f
              ? f(prop as NonNullable<EditorProps[PropName]>)
              : (prop as Result);
          }
        }
        for (const plugin of this.state.plugins) {
          const prop = plugin.props[propName as keyof typeof plugin.props];
          if (prop != null) {
            return f
              ? f(prop as NonNullable<EditorProps[PropName]>)
              : (prop as Result);
          }
        }
        return;
      },
      hasFocus() {
        return this.root.activeElement == this.dom;
      },
      get root(): Document | ShadowRoot {
        const cached = this["_root"];
        if (cached == null)
          for (
            let search = this.dom.parentNode;
            search;
            search = search.parentNode
          ) {
            if (
              search.nodeType == 9 ||
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (search.nodeType == 11 && (search as any).host)
            ) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if (!(search as any).getSelection)
                Object.getPrototypeOf(search).getSelection = () =>
                  (search as DOMNode).ownerDocument?.getSelection();
              return (this["_root"] = search as Document | ShadowRoot);
            }
          }
        return cached || document;
      },
      domSelection() {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return (this.root as Document).getSelection()!;
      },
      domSelectionRange() {
        return browser.safari &&
          this.root.nodeType === 11 &&
          deepActiveElement(this.dom.ownerDocument) == this.dom
          ? safariShadowSelectionRange(this)
          : this.domSelection();
      },
      props: {
        editable: editableProp,
        state: stateProp ?? defaultState,
        dispatchTransaction: dispatchProp,
      },
      nodeDOM(pos) {
        return posToDesc.current.get(pos)?.dom ?? null;
      },
      domAtPos(pos, side = 0) {
        return this.docView.domFromPos(pos, side);
      },
      coordsAtPos(pos, side = 1) {
        return coordsAtPos(this, pos, side);
      },
      posAtCoords(coords) {
        return posAtCoords(this, coords);
      },
      posAtDOM(node: DOMNode, offset: number, bias = -1): number {
        const pos = this.docView.posFromDOM(node, offset, bias);
        if (pos == null)
          throw new RangeError("DOM position not inside the editor");
        return pos;
      },
      endOfTextblock(
        dir: "up" | "down" | "left" | "right" | "forward" | "backward",
        state?: EditorState
      ): boolean {
        return endOfTextblock(this, state || this.state, dir);
      },
    };
    api.dispatch = api.dispatch.bind(api);
    return api;
  }, [
    handleDOMEvents,
    handleClick,
    handleClickOn,
    handleDoubleClick,
    handleDoubleClickOn,
    handleDrop,
    handleKeyDown,
    handleKeyPress,
    handlePaste,
    handleScrollToSelection,
    handleTextInput,
    handleTripleClick,
    handleTripleClickOn,
    editable,
    state,
    editableProp,
    stateProp,
    defaultState,
    dispatchProp,
    plugins,
  ]);

  editorViewRefInternal.current = editorViewAPI;

  const editorViewRef =
    editorViewRefInternal as MutableRefObject<EditorViewInternal>;

  useEffect(() => {
    editorViewRef.current.domObserver.connectSelection();
  }, [editorViewRef]);
  useSyncSelection(editorViewRef);
  useContentEditable(editorViewRef);
  usePluginViews(editorViewRef, plugins);

  return (
    <LayoutGroup>
      <EditorViewContext.Provider value={editorViewAPI}>
        <NodeViewContext.Provider
          value={{
            mount: mountRef.current,
            posToDesc: posToDesc.current,
            domToDesc: domToDesc.current,
            nodeViews,
            state,
          }}
        >
          <>
            <DocNodeView
              {...mountProps}
              ref={mountRef}
              node={state.doc}
              contentEditable={editable}
              decorations={decorations as unknown as DecorationSourceInternal}
            />
            {children}
          </>
        </NodeViewContext.Provider>
      </EditorViewContext.Provider>
    </LayoutGroup>
  );
}
