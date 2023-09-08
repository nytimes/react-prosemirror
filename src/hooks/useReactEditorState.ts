import { useContext } from "react";

import { EditorViewContext } from "../contexts/EditorViewContext.js";

export function useReactEditorState() {
  const { state } = useContext(EditorViewContext);
  return state;
}
