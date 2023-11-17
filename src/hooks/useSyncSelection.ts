import { EditorView } from "prosemirror-view";
import { useEffect } from "react";

import { selectionToDOM } from "../selection/selectionToDOM.js";

export function useSyncSelection(view: EditorView | null) {
  useEffect(() => {
    if (!view?.state) return;

    if (view?.composing) return;

    selectionToDOM(view);
  });
}
