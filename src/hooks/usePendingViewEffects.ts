import { useLayoutEffect } from "react";

import { ReactEditorView } from "./useEditorView.js";

export function usePendingViewEffects(view: ReactEditorView | null) {
  useLayoutEffect(() => {
    // @ts-expect-error Internal property - domObserver
    view?.domObserver.selectionToDOM();
    view?.runPendingEffects();
  }, [view, view?.props]);
}
