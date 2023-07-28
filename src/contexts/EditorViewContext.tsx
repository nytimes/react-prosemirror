import type { EditorView as EditorViewT } from "prosemirror-view";
import { createContext } from "react";

export const EditorViewContext = createContext(null as unknown as EditorViewT);
