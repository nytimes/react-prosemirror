import { createContext } from "react";

import { EditorView } from "../prosemirror-view/index.js";

export const EditorViewContext = createContext<EditorView | null>(null);
