import { EditorState } from "prosemirror-state";
import { createContext } from "react";

import { EditorView } from "../prosemirror-view/index.js";

interface EditorViewContextValue {
  view: EditorView | null;
  state: EditorState | null;
}

export const EditorViewContext = createContext<EditorViewContextValue>(
  null as unknown as EditorViewContextValue
);
