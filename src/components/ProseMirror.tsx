import { Command, EditorState, Transaction } from "prosemirror-state";
import {
  DecorationSet,
  DecorationSet as DecorationSetInternal,
  DirectEditorProps,
  EditorView as EditorViewClass,
  NodeViewConstructor,
} from "prosemirror-view";
import React, {
  ForwardRefExoticComponent,
  ReactElement,
  ReactNode,
  RefAttributes,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { EditorContext } from "../contexts/EditorContext.js";
import { LayoutGroup } from "../contexts/LayoutGroup.js";
import { NodeViewContext } from "../contexts/NodeViewContext.js";
import { computeDocDeco } from "../decorations/computeDocDeco.js";
import { viewDecorations } from "../decorations/viewDecorations.js";
import { useBeforeInput } from "../hooks/useBeforeInput.js";
import { useComponentEventListeners } from "../hooks/useComponentEventListeners.js";
import { useEditorView } from "../hooks/useEditorView.js";
import { usePluginViews } from "../hooks/usePluginViews.js";
import { useSyncSelection } from "../hooks/useSyncSelection.js";
import { NodeViewDesc } from "../viewdesc.js";

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
    customNodeViews?: {
      [nodeType: string]: NodeViewConstructor;
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
  customNodeViews = {},
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

  const initialEditorState = (
    "defaultState" in props ? props.defaultState : props.state
  ) as EditorState;
  const tempDom = document.createElement("div");
  const docViewDescRef = useRef<NodeViewDesc>(
    new NodeViewDesc(
      undefined,
      [],
      initialEditorState.doc,
      [],
      DecorationSetInternal.empty,
      tempDom,
      null,
      tempDom
    )
  );

  const editorView = useEditorView(mount, {
    ...props,
    docView: docViewDescRef.current,
    plugins,
    nodeViews: customNodeViews,
  });

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (editorView as any | null)?.domObserver.stop();

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editorView as any | null)?.domObserver.start();
  });

  const viewPlugins = useMemo(() => props.plugins ?? [], [props.plugins]);

  useBeforeInput(editorView);
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
              viewDesc={docViewDescRef.current}
            />
            {children}
          </>
        </NodeViewContext.Provider>
      </EditorContext.Provider>
    </LayoutGroup>
  );
}
