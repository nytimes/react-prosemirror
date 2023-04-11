import type { EditorState } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import { createContext } from "react";

interface EditorContextValue {
  editorView: EditorView | null;
  editorState: EditorState | null;
}

/**
 * Provides the EditorView, as well as the current
 * EditorState. Should not be consumed directly; instead
 * see `useEditorState`, `useEditorViewEvent`, and
 * `useEditorViewLayoutEffect`.
 */
export const EditorContext = createContext(
  null as unknown as EditorContextValue
);

export const EditorProvider = EditorContext.Provider;
