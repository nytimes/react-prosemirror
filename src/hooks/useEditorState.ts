import type { EditorState } from "prosemirror-state";
import { useContext } from "react";

import { EditorContext } from "../components/EditorContext.js";

/**
 * Provides access to the current EditorState value.
 */
export function useEditorState(): EditorState {
  const { editorState } = useContext(EditorContext);

  return editorState;
}
