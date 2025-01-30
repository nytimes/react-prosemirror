import { EditorContext } from "../contexts/EditorContext.js";
import type { EditorContextValue } from "../contexts/EditorContext.js";

import type { EditorState } from "prosemirror-state";
import { useContext } from "react";

/**
 * Provides access to the current EditorState value and method to update it.
 */
export function useEditorState(): [
  EditorState,
  EditorContextValue["setEditorState"],
] {
  const { editorState, setEditorState } = useContext(EditorContext);
  return [editorState, setEditorState];
}
