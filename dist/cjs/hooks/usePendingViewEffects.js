"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "usePendingViewEffects", {
    enumerable: true,
    get: ()=>usePendingViewEffects
});
const _react = require("react");
function usePendingViewEffects(view) {
    (0, _react.useLayoutEffect)(()=>{
        // @ts-expect-error Internal property - domObserver
        view?.domObserver.selectionToDOM();
        view?.runPendingEffects();
    }, [
        view,
        view?.props
    ]);
}
