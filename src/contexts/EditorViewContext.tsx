import { MutableRefObject, createContext } from "react";

import { EditorViewInternal } from "../prosemirror-internal/EditorViewInternal.js";

export const EditorViewContext = createContext(
  null as unknown as EditorViewInternal
);
