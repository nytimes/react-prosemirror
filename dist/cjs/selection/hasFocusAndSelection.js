"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    hasFocusAndSelection: ()=>hasFocusAndSelection,
    hasSelection: ()=>hasSelection
});
function hasFocusAndSelection(view) {
    if (view.editable && !view.hasFocus()) return false;
    return hasSelection(view);
}
function hasSelection(view) {
    // @ts-expect-error Internal method
    const sel = view.domSelectionRange();
    if (!sel.anchorNode) return false;
    try {
        // Firefox will raise 'permission denied' errors when accessing
        // properties of `sel.anchorNode` when it's in a generated CSS
        // element.
        return view.dom.contains(sel.anchorNode.nodeType == 3 ? sel.anchorNode.parentNode : sel.anchorNode) && (view.editable || view.dom.contains(sel.focusNode?.nodeType == 3 ? sel.focusNode?.parentNode : sel.focusNode));
    } catch (_) {
        return false;
    }
}
