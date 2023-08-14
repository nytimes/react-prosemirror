import { useEffect } from "react";

import { EditorViewInternal } from "../prosemirror-view/EditorViewInternal.js";
import { selectionToDOM } from "../prosemirror-view/selection.js";

export function useSyncSelection(view: EditorViewInternal | null) {
  useEffect(() => {
    if (!view) return;

    const { domObserver } = view;
    domObserver.connectSelection();

    return () => domObserver.disconnectSelection();
  }, [view]);

  useEffect(() => {
    if (!view?.state) return;

    selectionToDOM(view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view?.state]);
}
