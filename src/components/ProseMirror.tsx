import { Command, EditorState, Transaction } from "prosemirror-state";
import {
  Decoration,
  DecorationSet,
  DecorationSet as DecorationSetInternal,
  DirectEditorProps,
  EditorView as EditorViewClass,
  NodeViewConstructor,
} from "prosemirror-view";
import React, {
  ForwardRefExoticComponent,
  ReactNode,
  RefAttributes,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";

import { EditorContext } from "../contexts/EditorContext.js";
import { LayoutGroup } from "../contexts/LayoutGroup.js";
import { NodeViewContext } from "../contexts/NodeViewContext.js";
import { computeDocDeco } from "../decorations/computeDocDeco.js";
import { viewDecorations } from "../decorations/viewDecorations.js";
import { useComponentEventListeners } from "../hooks/useComponentEventListeners.js";
import { ReactEditorView, useEditorView } from "../hooks/useEditorView.js";
import { usePendingViewEffects } from "../hooks/usePendingViewEffects.js";
import { beforeInputPlugin } from "../plugins/beforeInputPlugin.js";
import { NodeViewDesc } from "../viewdesc.js";

import { NodeViewComponentProps } from "./NodeViewComponentProps.js";
import { DocNodeViewContext } from "./ProseMirrorDoc.js";

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
};

export function ProseMirror({
  className,
  children,
  nodeViews = {},
  customNodeViews = {},
  ...props
}: Props) {
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [cursorWrapper, _setCursorWrapper] = useState<Decoration | null>(null);

  const setCursorWrapper = useCallback((deco: Decoration | null) => {
    flushSync(() => {
      _setCursorWrapper(deco);
    });
  }, []);

  const {
    componentEventListenersPlugin,
    registerEventListener,
    unregisterEventListener,
  } = useComponentEventListeners();

  const plugins = useMemo(
    () => [
      ...(props.plugins ?? []),
      componentEventListenersPlugin,
      beforeInputPlugin(setCursorWrapper),
    ],
    [props.plugins, componentEventListenersPlugin, setCursorWrapper]
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

  usePendingViewEffects(editorView as ReactEditorView | null);

  const innerDecos = editorView
    ? viewDecorations(editorView, cursorWrapper)
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
          <DocNodeViewContext.Provider
            value={{
              className: className,
              setMount: setMount,
              node: editorView?.state.doc,
              innerDeco: innerDecos as unknown as DecorationSetInternal,
              outerDeco: outerDecos,
              viewDesc: docViewDescRef.current,
            }}
          >
            {children}
          </DocNodeViewContext.Provider>
        </NodeViewContext.Provider>
      </EditorContext.Provider>
    </LayoutGroup>
  );
}
