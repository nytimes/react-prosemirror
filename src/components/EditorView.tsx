import { Command, EditorState, Transaction } from "prosemirror-state";
import { DecorationSet } from "prosemirror-view";
import React, {
  ForwardRefExoticComponent,
  ReactNode,
  RefAttributes,
  useCallback,
  useEffect,
  useState,
} from "react";

import { EditorViewContext } from "../contexts/EditorViewContext.js";
import { LayoutGroup } from "../contexts/LayoutGroup.js";
import { NodeViewContext } from "../contexts/NodeViewContext.js";
import { useContentEditable } from "../hooks/useContentEditable.js";
import { useReactEditorView } from "../hooks/useReactEditorView.js";
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

export type Props = EditorProps & { className?: string; children?: ReactNode };

export function EditorView({
  className,
  children,
  editable: editableProp,
  decorations = DecorationSetInternal.empty as unknown as DecorationSet,
  nodeViews = {},
  ...props
}: Props) {
  const getDecorations = useCallback(
    () => decorations as unknown as DecorationSetInternal,
    [decorations]
  );

  const [mount, setMount] = useState<HTMLElement | null>(null);

  // This is only safe to use in effects/layout effects or
  // event handlers!
  const reactEditorView = useReactEditorView(mount, {
    ...props,
    decorations: getDecorations,
  });

  useEffect(() => {
    reactEditorView?.domObserver.connectSelection();
    return () => reactEditorView?.domObserver.disconnectSelection();
  }, [reactEditorView?.domObserver]);
  useSyncSelection(reactEditorView);
  useContentEditable(reactEditorView);
  usePluginViews(reactEditorView, props.plugins ?? []);

  const innerDecos = reactEditorView
    ? viewDecorations(reactEditorView)
    : (DecorationSetInternal.empty as unknown as DecorationSet);

  const outerDecos = reactEditorView ? computeDocDeco(reactEditorView) : [];

  return (
    <LayoutGroup>
      <EditorViewContext.Provider value={reactEditorView}>
        <NodeViewContext.Provider
          value={{
            nodeViews,
          }}
        >
          <>
            <DocNodeView
              className={className}
              ref={setMount}
              node={reactEditorView?.state.doc}
              contentEditable={
                reactEditorView?.props.editable?.(reactEditorView.state) ?? true
              }
              innerDeco={innerDecos as unknown as DecorationSetInternal}
              outerDeco={outerDecos}
            />
            {children}
          </>
        </NodeViewContext.Provider>
      </EditorViewContext.Provider>
    </LayoutGroup>
  );
}
