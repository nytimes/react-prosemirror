/* eslint-disable @typescript-eslint/no-explicit-any */ /* eslint-disable @typescript-eslint/no-non-null-assertion */ export const domIndex = function(node) {
    for(let index = 0;; index++){
        node = node.previousSibling;
        if (!node) return index;
    }
};
export const parentNode = function(node) {
    const parent = node.assignedSlot || node.parentNode;
    return parent && parent.nodeType == 11 ? parent.host : parent;
};
let reusedRange = null;
// Note that this will always return the same range, because DOM range
// objects are every expensive, and keep slowing down subsequent DOM
// updates, for some reason.
export const textRange = function(node, from, to) {
    const range = reusedRange || (reusedRange = document.createRange());
    range.setEnd(node, to == null ? node.nodeValue.length : to);
    range.setStart(node, from || 0);
    return range;
};
// Scans forward and backward through DOM positions equivalent to the
// given one to see if the two are in the same place (i.e. after a
// text node vs at the end of that text node)
export const isEquivalentPosition = function(node, off, targetNode, targetOff) {
    return targetNode && (scanFor(node, off, targetNode, targetOff, -1) || scanFor(node, off, targetNode, targetOff, 1));
};
const atomElements = /^(img|br|input|textarea|hr)$/i;
function scanFor(node, off, targetNode, targetOff, dir) {
    for(;;){
        if (node == targetNode && off == targetOff) return true;
        if (off == (dir < 0 ? 0 : nodeSize(node))) {
            const parent = node.parentNode;
            if (!parent || parent.nodeType != 1 || hasBlockDesc(node) || atomElements.test(node.nodeName) || node.contentEditable == "false") return false;
            off = domIndex(node) + (dir < 0 ? 0 : 1);
            node = parent;
        } else if (node.nodeType == 1) {
            node = node.childNodes[off + (dir < 0 ? -1 : 0)];
            if (node.contentEditable == "false") return false;
            off = dir < 0 ? nodeSize(node) : 0;
        } else {
            return false;
        }
    }
}
export function nodeSize(node) {
    return node.nodeType == 3 ? node.nodeValue.length : node.childNodes.length;
}
export function isOnEdge(node, offset, parent) {
    for(let atStart = offset == 0, atEnd = offset == nodeSize(node); atStart || atEnd;){
        if (node == parent) return true;
        const index = domIndex(node);
        node = node.parentNode;
        if (!node) return false;
        atStart = atStart && index == 0;
        atEnd = atEnd && index == nodeSize(node);
    }
    return false;
}
export function hasBlockDesc(dom) {
    let desc;
    for(let cur = dom; cur; cur = cur.parentNode)if (desc = cur.pmViewDesc) break;
    return desc && desc.node && desc.node.isBlock && (desc.dom == dom || desc.contentDOM == dom);
}
// Work around Chrome issue https://bugs.chromium.org/p/chromium/issues/detail?id=447523
// (isCollapsed inappropriately returns true in shadow dom)
export const selectionCollapsed = function(domSel) {
    return domSel.focusNode && isEquivalentPosition(domSel.focusNode, domSel.focusOffset, domSel.anchorNode, domSel.anchorOffset);
};
export function keyEvent(keyCode, key) {
    const event = document.createEvent("Event");
    event.initEvent("keydown", true, true);
    event.keyCode = keyCode;
    event.key = event.code = key;
    return event;
}
export function deepActiveElement(doc) {
    let elt = doc.activeElement;
    while(elt && elt.shadowRoot)elt = elt.shadowRoot.activeElement;
    return elt;
}
export function caretFromPoint(doc, x, y) {
    if (doc.caretPositionFromPoint) {
        try {
            // Firefox throws for this call in hard-to-predict circumstances (#994)
            const pos = doc.caretPositionFromPoint(x, y);
            // Clip the offset, because Chrome will return a text offset
            // into <input> nodes, which can't be treated as a regular DOM
            // offset
            if (pos) return {
                node: pos.offsetNode,
                offset: Math.min(nodeSize(pos.offsetNode), pos.offset)
            };
        } catch (_) {
        // pass
        }
    }
    if (doc.caretRangeFromPoint) {
        const range = doc.caretRangeFromPoint(x, y);
        if (range) return {
            node: range.startContainer,
            offset: Math.min(nodeSize(range.startContainer), range.startOffset)
        };
    }
    return;
}
