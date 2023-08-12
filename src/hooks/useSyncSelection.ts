import { MutableRefObject, useEffect } from "react";

import { EditorViewInternal } from "../prosemirror-internal/EditorViewInternal.js";
import { selectionToDOM } from "../prosemirror-internal/selection.js";

export function useSyncSelection(view: MutableRefObject<EditorViewInternal>) {
  useEffect(() => {
    const { domObserver } = view.current;
    domObserver.connectSelection();

    return () => domObserver.disconnectSelection();
  }, [view]);

  useEffect(() => {
    selectionToDOM(view.current);
    // This is safe; we only update view.current when we re-render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.current]);
}
