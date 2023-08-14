import { Command, EditorState, Transaction } from "prosemirror-state";
import { DecorationSet } from "prosemirror-view";
import React, {
  DetailedHTMLProps,
  ForwardRefExoticComponent,
  HTMLAttributes,
  RefAttributes,
  useCallback,
  useEffect,
  useState,
} from "react";

import { SelectionDOMObserver } from "../SelectionDOMObserver.js";
import { EditorViewContext } from "../contexts/EditorViewContext.js";
import { LayoutGroup } from "../contexts/LayoutGroup.js";
import { NodeViewContext } from "../contexts/NodeViewContext.js";
import { useContentEditable } from "../hooks/useContentEditable.js";
import { useSyncSelection } from "../hooks/useSyncSelection.js";
import { usePluginViews } from "../hooks/useViewPlugins.js";
import {
  DecorationSet as DecorationSetInternal,
  DirectEditorProps,
  EditorView as EditorViewClass,
} from "../prosemirror-view/index.js";
import { NodeViewDesc } from "../prosemirror-view/viewdesc.js";

import { DocNodeView } from "./DocNodeView.js";
import { NodeViewComponentProps } from "./NodeViewComponentProps.js";

class ReactEditorView extends EditorViewClass {
  init() {
    this.domObserver.start();
    this.initInput();
  }

  updateState(state: EditorState) {
    this.state = state;
  }

  // @ts-expect-error We need this to be an accessor
  set docView(_) {
    // disallowed
  }

  get docView() {
    return this.dom.pmViewDesc as NodeViewDesc;
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
    dispatchTransaction?: (this: EditorViewClass, tr: Transaction) => void;
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

  const getDecorations = useCallback(
    () => decorations as unknown as DecorationSetInternal,
    [decorations]
  );

  // This is only safe to use in effects/layout effects or
  // event handlers!
  const [reactEditorView, setReactEditorView] =
    useState<EditorViewClass | null>(null);
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
                // TODO: This should probably be happening in a hook.
                // In fact, this looks almost identical to useEditorView;
                // we can almost certainly use exactly that hook here.
                if (reactEditorView?.dom == el) {
                  return;
                }
                if (el && !reactEditorView) {
                  const newReactEditorView = new ReactEditorView(
                    { mount: el },
                    {
                      DOMObserver: SelectionDOMObserver,
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
                      dispatchTransaction(this: ReactEditorView, tr) {
                        if (dispatchProp) {
                          dispatchProp.call(this, tr);
                        } else {
                          setInternalState(this.state.apply(tr));
                        }
                      },
                      plugins,
                    }
                  );

                  newReactEditorView.updateState(state);

                  setReactEditorView(newReactEditorView);
                  // } else {
                  //   setReactEditorView(null);
                }
              }}
              node={state.doc}
              contentEditable={editable}
              decorations={decorations as unknown as DecorationSetInternal}
            />
            {children}
          </>
        </NodeViewContext.Provider>
      </EditorViewContext.Provider>
    </LayoutGroup>
  );
}
