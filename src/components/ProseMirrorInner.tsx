import type { EditorState, Transaction } from "prosemirror-state";
import type { EditorProps } from "prosemirror-view";
import React from "react";
import type { ReactNode } from "react";

import { EditorViewContext } from "../contexts/EditorViewContext.js";
import { useEditorView } from "../hooks/useEditorView.js";

export interface ProseMirrorProps {
  dispatchTransaction: (tr: Transaction) => void;
  editorProps: EditorProps;
  editorState: EditorState;
  mount: HTMLElement | null;
  children?: ReactNode | null;
}

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
  editorProps,
  editorState,
  mount,
}: ProseMirrorProps) {
  const editorView = useEditorView(mount, {
    ...editorProps,
    state: editorState,
    dispatchTransaction,
  });

  return (
    <EditorViewContext.Provider value={{ editorView, editorState }}>
      {children ?? null}
    </EditorViewContext.Provider>
  );
}
