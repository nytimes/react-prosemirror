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
  RefAttributes,
  useCallback,
  useEffect,
  useState,
} from "react";

import { EditorViewContext } from "../contexts/EditorViewContext.js";
import { LayoutGroup } from "../contexts/LayoutGroup.js";
import { NodeViewContext } from "../contexts/NodeViewContext.js";
import { useContentEditable } from "../hooks/useContentEditable.js";
import { useSyncSelection } from "../hooks/useSyncSelection.js";
import { usePluginViews } from "../hooks/useViewPlugins.js";
import { DecorationSourceInternal } from "../prosemirror-internal/DecorationInternal.js";
import { EditorViewInternal } from "../prosemirror-internal/EditorViewInternal.js";
import { DOMObserver } from "../prosemirror-internal/domobserver.js";
import { initInput } from "../prosemirror-internal/input.js";

import { DocNodeView } from "./DocNodeView.js";
import { NodeViewComponentProps } from "./NodeViewComponentProps.js";

class ReactEditorView extends EditorViewT {
  constructor(place: { mount: HTMLElement }, props: DirectEditorProps) {
    super(null, props);
    this.dom = place.mount;
    this.domObserver.stop();
    this.domObserver = new DOMObserver(this as unknown as EditorViewInternal);
    this.domObserver.start();
    initInput(this);
  }
  set docView(_docView) {
    // We handle this ourselves
  }
  get docView() {
    return this.dom.pmViewDesc;
  }
  updateState(state: EditorState) {
    // eslint-disable-next-line react/no-direct-mutation-state
    this.state = state;
  }
  update(_props: DirectEditorProps) {
    // React takes care of this
  }
  destroy() {
    // React takes care of this
  }
}

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

  // We always set internalState above if there's no state prop
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const state = stateProp ?? internalState!;

  const editable = editableProp ? editableProp(state) : true;

  const getDecorations = useCallback(() => decorations, [decorations]);

  // This is only safe to use in effects/layout effects or
  // event handlers!
  const [reactEditorView, setReactEditorView] =
    useState<EditorViewInternal | null>(null);
  reactEditorView?.updateState(state);

  useEffect(() => {
    reactEditorView?.domObserver.connectSelection();
    return () => reactEditorView?.domObserver.disconnectSelection();
  }, [reactEditorView?.domObserver]);
  useSyncSelection(reactEditorView);
  useContentEditable(reactEditorView);
  usePluginViews(reactEditorView, plugins);

  return (
    <LayoutGroup>
      <EditorViewContext.Provider value={reactEditorView}>
        <NodeViewContext.Provider
          value={{
            nodeViews,
            state,
          }}
        >
          <>
            <DocNodeView
              {...mountProps}
              ref={(el) => {
                if (reactEditorView?.dom == el) {
                  return;
                }
                if (el && !reactEditorView) {
                  const newReactEditorView = new ReactEditorView(
                    { mount: el },
                    {
                      decorations: getDecorations,
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
                      editable: () => editable,
                      state: EditorState.create({ schema: state.schema }),
                      dispatchTransaction(this: EditorViewT, tr) {
                        if (dispatchProp) {
                          dispatchProp.call(this, tr);
                        } else {
                          setInternalState(this.state.apply(tr));
                        }
                      },
                      plugins,
                    }
                  ) as unknown as EditorViewInternal;

                  newReactEditorView.updateState(state);

                  setReactEditorView(newReactEditorView);
                  // } else {
                  //   setReactEditorView(null);
                }
              }}
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
