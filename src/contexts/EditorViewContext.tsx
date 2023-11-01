import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { createContext } from "react";

interface EditorViewContextValue {
  view: EditorView | null;
  state: EditorState | null;
}

export const EditorViewContext = createContext<EditorViewContextValue>(
  null as unknown as EditorViewContextValue
);
