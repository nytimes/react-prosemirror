import { Command, EditorState, Transaction } from "prosemirror-state";
import { DecorationSet } from "prosemirror-view";
import React, {
  ForwardRefExoticComponent,
  ReactElement,
  ReactNode,
  RefAttributes,
  useEffect,
  useMemo,
  useState,
} from "react";

import { EditorContext } from "../contexts/EditorContext.js";
import { LayoutGroup } from "../contexts/LayoutGroup.js";
import { NodeViewContext } from "../contexts/NodeViewContext.js";
import { useComponentEventListeners } from "../hooks/useComponentEventListeners.js";
import { useEditorView } from "../hooks/useEditorView.js";
import { useSyncSelection } from "../hooks/useSyncSelection.js";
import { usePluginViews } from "../hooks/useViewPlugins.js";
import { viewDecorations } from "../prosemirror-view/decoration.js";
import {
  DecorationSet as DecorationSetInternal,
  DirectEditorProps,
  EditorView as EditorViewClass,
  computeDocDeco,
} from "../prosemirror-view/index.js";

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
  "state" | "nodeViews" | "dispatchTransaction"
> &
  EditorStateProps & {
    keymap?: { [key: string]: Command };
    nodeViews?: {
      [nodeType: string]: ForwardRefExoticComponent<
        // We need to allow refs to any type of HTMLElement, but there's
        // no way to express that that still allows consumers to correctly
        // type their own refs. This is sufficient to ensure that there's
        // a ref of _some_ kind, which is enough.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        NodeViewComponentProps & RefAttributes<any>
      >;
    };
    dispatchTransaction?: (this: EditorViewClass, tr: Transaction) => void;
  };

export type Props = EditorProps & {
  className?: string;
  children?: ReactNode;
  as?: ReactElement;
};

export function ProseMirror({
  className,
  children,
  nodeViews = {},
  as,
  ...props
}: Props) {
  const [mount, setMount] = useState<HTMLElement | null>(null);

  const {
    componentEventListenersPlugin,
    registerEventListener,
    unregisterEventListener,
  } = useComponentEventListeners();

  const plugins = useMemo(
    () => [...(props.plugins ?? []), componentEventListenersPlugin],
    [props.plugins, componentEventListenersPlugin]
  );

  const editorView = useEditorView(mount, { ...props, plugins });

  const editorState =
    "state" in props ? props.state ?? null : editorView?.state ?? null;

  const contextValue = useMemo(
    () => ({
      editorView,
      editorState,
      registerEventListener,
      unregisterEventListener,
    }),
    [editorState, editorView, registerEventListener, unregisterEventListener]
  );

  // TODO: This might not be safe (especially with Suspense?)
  // I _think_ it's not strictly necessary, but I want to try to get
  // composition working 100% before removing it, because it makes
  // it easier to reason about
  editorView?.domObserver.stop();

  useEffect(() => {
    editorView?.domObserver.start();
  });

  const viewPlugins = useMemo(() => props.plugins ?? [], [props.plugins]);

  useEffect(() => {
    editorView?.domObserver.connectSelection();
    return () => editorView?.domObserver.disconnectSelection();
  }, [editorView?.domObserver]);
  useSyncSelection(editorView);
  usePluginViews(editorView, editorState, viewPlugins);

  const innerDecos = editorView
    ? viewDecorations(editorView)
    : (DecorationSetInternal.empty as unknown as DecorationSet);

  const outerDecos = editorView ? computeDocDeco(editorView) : [];

  return (
    <LayoutGroup>
      <EditorContext.Provider value={contextValue}>
        <NodeViewContext.Provider
          value={{
            nodeViews,
          }}
        >
          <>
            <DocNodeView
              className={className}
              ref={setMount}
              node={editorView?.state.doc}
              innerDeco={innerDecos as unknown as DecorationSetInternal}
              outerDeco={outerDecos}
              as={as}
            />
            {children}
          </>
        </NodeViewContext.Provider>
      </EditorContext.Provider>
    </LayoutGroup>
  );
}
