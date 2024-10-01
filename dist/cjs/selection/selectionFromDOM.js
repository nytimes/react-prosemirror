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
    selectionBetween: ()=>selectionBetween,
    selectionFromDOM: ()=>selectionFromDOM
});
const _prosemirrorState = require("prosemirror-state");
const _domJs = require("../dom.js");
function selectionBetween(view, $anchor, $head, bias) {
    return view.someProp("createSelectionBetween", (f)=>f(view, $anchor, $head)) || _prosemirrorState.TextSelection.between($anchor, $head, bias);
}
function selectionFromDOM(view) {
    let origin = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
    // @ts-expect-error Internal method
    const domSel = view.domSelectionRange(), doc = view.state.doc;
    if (!domSel.focusNode) return null;
    // @ts-expect-error Internal method
    let nearestDesc = view.docView.nearestDesc(domSel.focusNode);
    const inWidget = nearestDesc && nearestDesc.size == 0;
    // @ts-expect-error Internal method
    let head = view.docView.posFromDOM(domSel.focusNode, domSel.focusOffset, 1);
    if (head < 0) return null;
    let $head = doc.resolve(head), anchor, selection;
    if ((0, _domJs.selectionCollapsed)(domSel)) {
        anchor = head;
        while(nearestDesc && !nearestDesc.node)nearestDesc = nearestDesc.parent;
        const nearestDescNode = nearestDesc.node;
        if (nearestDesc && nearestDescNode.isAtom && _prosemirrorState.NodeSelection.isSelectable(nearestDescNode) && nearestDesc.parent && !(nearestDescNode.isInline && (0, _domJs.isOnEdge)(domSel.focusNode, domSel.focusOffset, nearestDesc.dom))) {
            const pos = nearestDesc.posBefore;
            selection = new _prosemirrorState.NodeSelection(head == pos ? $head : doc.resolve(pos));
        }
    } else {
        if (// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        domSel instanceof view.dom.ownerDocument.defaultView.Selection && domSel.rangeCount > 1) {
            let min = head, max = head;
            for(let i = 0; i < domSel.rangeCount; i++){
                const range = domSel.getRangeAt(i);
                min = Math.min(min, // @ts-expect-error Internal method
                view.docView.posFromDOM(range.startContainer, range.startOffset, 1));
                max = Math.max(max, // @ts-expect-error Internal method
                view.docView.posFromDOM(range.endContainer, range.endOffset, -1));
            }
            if (min < 0) return null;
            [anchor, head] = max == view.state.selection.anchor ? [
                max,
                min
            ] : [
                min,
                max
            ];
            $head = doc.resolve(head);
        } else {
            // @ts-expect-error Internal method
            anchor = view.docView.posFromDOM(// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            domSel.anchorNode, domSel.anchorOffset, 1);
        }
        if (anchor < 0) return null;
    }
    const $anchor = doc.resolve(anchor);
    if (!selection) {
        const bias = origin == "pointer" || view.state.selection.head < $head.pos && !inWidget ? 1 : -1;
        selection = selectionBetween(view, $anchor, $head, bias);
    }
    return selection;
}
