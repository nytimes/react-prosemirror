import { useLayoutEffect } from "react";
export function usePendingViewEffects(view) {
    useLayoutEffect(()=>{
        // @ts-expect-error Internal property - domObserver
        view?.domObserver.selectionToDOM();
        view?.runPendingEffects();
    }, [
        view,
        view?.props
    ]);
}
