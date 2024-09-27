import type { EditorState } from "prosemirror-state";
import { useContext } from "react";

import { EditorContext, type EditorContextValue } from "../contexts/EditorContext.js";

/**
 * Provides access to the current EditorState value.
 */
export function useEditorState(): EditorState {
  const { editorState } = useContext(EditorContext);
  return editorState;
}

/**
 * Provides access to the current EditorState value and method to update it.
 */
export function useEditorStateWithDispatch(): [EditorState, EditorContextValue['setEditorState']] {
  const { editorState, setEditorState } = useContext(EditorContext);
  return [editorState, setEditorState];
}
