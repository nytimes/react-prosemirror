import { EditorState } from "prosemirror-state";
import { EditorView as EditorViewPM } from "prosemirror-view";
import { createContext } from "react";

type EditorViewContextValue = {
  state: EditorState;
  dispatchTransaction: EditorViewPM["dispatch"];
};

export const EditorViewContext = createContext(
  null as unknown as EditorViewContextValue
);
