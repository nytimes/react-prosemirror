/* eslint-disable @typescript-eslint/no-explicit-any */ /* eslint-disable @typescript-eslint/no-non-null-assertion */ "use strict";
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
    domIndex: ()=>domIndex,
    parentNode: ()=>parentNode,
    textRange: ()=>textRange,
    isEquivalentPosition: ()=>isEquivalentPosition,
    nodeSize: ()=>nodeSize,
    isOnEdge: ()=>isOnEdge,
    hasBlockDesc: ()=>hasBlockDesc,
    selectionCollapsed: ()=>selectionCollapsed,
    keyEvent: ()=>keyEvent,
    deepActiveElement: ()=>deepActiveElement,
    caretFromPoint: ()=>caretFromPoint
});
const domIndex = function(node) {
    for(let index = 0;; index++){
        node = node.previousSibling;
        if (!node) return index;
    }
};
const parentNode = function(node) {
    const parent = node.assignedSlot || node.parentNode;
    return parent && parent.nodeType == 11 ? parent.host : parent;
};
let reusedRange = null;
const textRange = function(node, from, to) {
    const range = reusedRange || (reusedRange = document.createRange());
    range.setEnd(node, to == null ? node.nodeValue.length : to);
    range.setStart(node, from || 0);
    return range;
};
const isEquivalentPosition = function(node, off, targetNode, targetOff) {
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
function nodeSize(node) {
    return node.nodeType == 3 ? node.nodeValue.length : node.childNodes.length;
}
function isOnEdge(node, offset, parent) {
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
function hasBlockDesc(dom) {
    let desc;
    for(let cur = dom; cur; cur = cur.parentNode)if (desc = cur.pmViewDesc) break;
    return desc && desc.node && desc.node.isBlock && (desc.dom == dom || desc.contentDOM == dom);
}
const selectionCollapsed = function(domSel) {
    return domSel.focusNode && isEquivalentPosition(domSel.focusNode, domSel.focusOffset, domSel.anchorNode, domSel.anchorOffset);
};
function keyEvent(keyCode, key) {
    const event = document.createEvent("Event");
    event.initEvent("keydown", true, true);
    event.keyCode = keyCode;
    event.key = event.code = key;
    return event;
}
function deepActiveElement(doc) {
    let elt = doc.activeElement;
    while(elt && elt.shadowRoot)elt = elt.shadowRoot.activeElement;
    return elt;
}
function caretFromPoint(doc, x, y) {
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
