import type { EditorState } from "prosemirror-state";
import { useContext } from "react";

import { EditorViewContext } from "../contexts/EditorViewContext.js";

/**
 * Provides access to the current EditorState value.
 */
export function useEditorState(): EditorState | null {
  const { editorState } = useContext(EditorViewContext);

  return editorState;
}
