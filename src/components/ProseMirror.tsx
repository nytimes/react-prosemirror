import { DecorationSet, NodeViewConstructor } from "prosemirror-view";
import React, {
  ForwardRefExoticComponent,
  ReactNode,
  RefAttributes,
  useMemo,
  useState,
} from "react";

import { EditorContext } from "../contexts/EditorContext.js";
import { EditorStateContext } from "../contexts/EditorStateContext.js";
import { NodeViewContext } from "../contexts/NodeViewContext.js";
import { computeDocDeco } from "../decorations/computeDocDeco.js";
import { viewDecorations } from "../decorations/viewDecorations.js";
import { UseEditorOptions, useEditor } from "../hooks/useEditor.js";

import { LayoutGroup } from "./LayoutGroup.js";
import { NodeViewComponentProps } from "./NodeViewComponentProps.js";
import { DocNodeViewContext } from "./ProseMirrorDoc.js";

export type Props = Omit<UseEditorOptions, "nodeViews"> & {
  className?: string;
  children?: ReactNode;
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
};

function ProseMirrorInner({
  className,
  children,
  nodeViews = {},
  customNodeViews,
  ...props
}: Props) {
  const [mount, setMount] = useState<HTMLElement | null>(null);

  const { editor, state } = useEditor(mount, {
    ...props,
    nodeViews: customNodeViews,
  });

  const innerDecos = useMemo(
    () =>
      editor.view
        ? viewDecorations(editor.view, editor.cursorWrapper)
        : (DecorationSet.empty as unknown as DecorationSet),
    [editor.cursorWrapper, editor.view]
  );

  const outerDecos = useMemo(
    () => (editor.view ? computeDocDeco(editor.view) : []),
    [editor.view]
  );

  const nodeViewContextValue = useMemo(
    () => ({
      nodeViews,
    }),
    [nodeViews]
  );

  const docNodeViewContextValue = useMemo(
    () => ({
      className: className,
      setMount: setMount,
      node: editor.view?.state.doc,
      innerDeco: innerDecos,
      outerDeco: outerDecos,
      viewDesc: editor.docViewDescRef.current,
    }),
    [
      className,
      editor.docViewDescRef,
      editor.view?.state.doc,
      innerDecos,
      outerDecos,
    ]
  );

  return (
    <EditorContext.Provider value={editor}>
      <EditorStateContext.Provider value={state}>
        <NodeViewContext.Provider value={nodeViewContextValue}>
          <DocNodeViewContext.Provider value={docNodeViewContextValue}>
            {children}
          </DocNodeViewContext.Provider>
        </NodeViewContext.Provider>
      </EditorStateContext.Provider>
    </EditorContext.Provider>
  );
}

export function ProseMirror(props: Props) {
  return (
    <LayoutGroup>
      <ProseMirrorInner {...props} />
    </LayoutGroup>
  );
}
