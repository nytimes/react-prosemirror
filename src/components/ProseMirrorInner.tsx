import type { DirectEditorProps } from "prosemirror-view";
import React, { Context, useMemo } from "react";
import type { ReactNode } from "react";

import { EditorContext } from "../contexts/EditorContext.js";
import { LayoutGroupContext } from "../contexts/LayoutGroup.js";
import { useEditorView } from "../hooks/useEditorView.js";
import { useNodeViews } from "../hooks/useNodeViews.js";
import { ReactNodeView } from "../nodeViews/createReactNodeViewConstructor.js";

export type ProseMirrorProps = DirectEditorProps & {
  mount: HTMLElement | null;
  children?: ReactNode | null;
  reactNodeViews?: Record<string, ReactNodeView>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contexts?: Context<any>[];
};

/**
 * Renders the ProseMirror View onto a DOM mount.
 *
 * The `mount` prop must be an actual HTMLElement instance. The
 * JSX element representing the mount should be passed as a child
 * to the ProseMirror component.
 *
 * e.g.
 *
 * ```
 * function MyProseMirrorField() {
 *   const [mount, setMount] = useState(null);
 *
 *   return (
 *     <ProseMirror mount={mount}>
 *       <div ref={setMount} />
 *     </ProseMirror>
 *   );
 * }
 * ```
 */
export function ProseMirrorInner({
  children,
  dispatchTransaction,
  state,
  mount,
  reactNodeViews,
  contexts: userContexts = [],
  ...editorProps
}: ProseMirrorProps) {
  const contexts = useMemo(
    () => [...userContexts, LayoutGroupContext],
    [userContexts]
  );

  const { nodeViews } = useNodeViews(contexts, reactNodeViews);

  const editorView = useEditorView(mount, {
    ...editorProps,
    state,
    nodeViews,
    dispatchTransaction,
  });

  return (
    <EditorContext.Provider value={{ editorView, editorState: state }}>
      {children ?? null}
    </EditorContext.Provider>
  );
}
