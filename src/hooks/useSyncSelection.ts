import { EditorView } from "prosemirror-view";
import { useEffect } from "react";

import { selectionToDOM } from "../selection/selectionToDOM.js";

export function useSyncSelection(view: EditorView | null) {
  useEffect(() => {
    if (!view) return;

    const { domObserver } = view;
    domObserver.connectSelection();

    return () => domObserver.disconnectSelection();
  }, [view]);

  useEffect(() => {
    if (!view?.state) return;

    if (view?.composing) return;

    selectionToDOM(view);
  });
}
