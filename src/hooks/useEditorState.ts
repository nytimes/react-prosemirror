import type { EditorState } from "prosemirror-state";
import { useContext } from "react";

import { EditorStateContext } from "../contexts/EditorStateContext.js";

/**
 * Provides access to the current EditorState value.
 */
export function useEditorState(): EditorState {
  const editorState = useContext(EditorStateContext);

  return editorState;
}
