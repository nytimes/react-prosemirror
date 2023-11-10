import { EditorView } from "prosemirror-view";
import { useEffect } from "react";

import { selectionToDOM } from "../selection/selectionToDOM.js";

export function useSyncSelection(view: EditorView | null) {
  useEffect(() => {
    if (!view) return;

    // We don't have access to view.domObserver types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { domObserver } = view as any;
    domObserver.connectSelection();

    return () => domObserver.disconnectSelection();
  }, [view]);

  useEffect(() => {
    if (!view?.state) return;

    if (view?.composing) return;

    selectionToDOM(view);
  });
}
