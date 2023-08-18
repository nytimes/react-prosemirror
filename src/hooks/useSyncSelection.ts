import { useEffect } from "react";

import { EditorView } from "../prosemirror-view/index.js";
import { selectionToDOM } from "../prosemirror-view/selection.js";

export function useSyncSelection(view: EditorView | null) {
  useEffect(() => {
    if (!view) return;

    const { domObserver } = view;
    domObserver.connectSelection();

    return () => domObserver.disconnectSelection();
  }, [view]);

  useEffect(() => {
    if (!view?.state) return;

    selectionToDOM(view);
  });
}
