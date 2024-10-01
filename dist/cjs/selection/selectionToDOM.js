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
    isEquivalentPosition: ()=>isEquivalentPosition,
    hasBlockDesc: ()=>hasBlockDesc,
    domIndex: ()=>domIndex,
    nodeSize: ()=>nodeSize,
    syncNodeSelection: ()=>syncNodeSelection,
    hasSelection: ()=>hasSelection,
    selectionToDOM: ()=>selectionToDOM
});
const _prosemirrorState = require("prosemirror-state");
const _browserJs = require("../browser.js");
const isEquivalentPosition = function(node, off, targetNode, targetOff) {
    return targetNode && (scanFor(node, off, targetNode, targetOff, -1) || scanFor(node, off, targetNode, targetOff, 1));
};
function hasBlockDesc(dom) {
    let desc;
    for(let cur = dom; cur; cur = cur.parentNode)if (desc = cur.pmViewDesc) break;
    return desc && desc.node && desc.node.isBlock && (desc.dom == dom || desc.contentDOM == dom);
}
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
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            node = node.childNodes[off + (dir < 0 ? -1 : 0)];
            if (node.contentEditable == "false") return false;
            off = dir < 0 ? nodeSize(node) : 0;
        } else {
            return false;
        }
    }
}
const domIndex = function(node) {
    let n = node;
    for(let index = 0;; index++){
        n = n.previousSibling;
        if (!n) return index;
    }
};
function nodeSize(node) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return node.nodeType == 3 ? node.nodeValue.length : node.childNodes.length;
}
function syncNodeSelection(view, sel) {
    const v = view;
    if (sel instanceof _prosemirrorState.NodeSelection) {
        const desc = v.docView.descAt(sel.from);
        if (desc != v.lastSelectedViewDesc) {
            clearNodeSelection(v);
            if (desc) desc.selectNode();
            v.lastSelectedViewDesc = desc;
        }
    } else {
        clearNodeSelection(v);
    }
}
// Clear all DOM statefulness of the last node selection.
function clearNodeSelection(view) {
    const v = view;
    if (v.lastSelectedViewDesc) {
        if (v.lastSelectedViewDesc.parent) v.lastSelectedViewDesc.deselectNode();
        v.lastSelectedViewDesc = undefined;
    }
}
function hasSelection(view) {
    const v = view;
    const sel = v.domSelectionRange();
    if (!sel.anchorNode) return false;
    try {
        // Firefox will raise 'permission denied' errors when accessing
        // properties of `sel.anchorNode` when it's in a generated CSS
        // element.
        return v.dom.contains(sel.anchorNode.nodeType == 3 ? sel.anchorNode.parentNode : sel.anchorNode) && (v.editable || v.dom.contains(// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        sel.focusNode.nodeType == 3 ? sel.focusNode.parentNode : sel.focusNode));
    } catch (_) {
        return false;
    }
}
function editorOwnsSelection(view) {
    return view.editable ? view.hasFocus() : hasSelection(view) && document.activeElement && document.activeElement.contains(view.dom);
}
function selectCursorWrapper(view) {
    const v = view;
    const domSel = v.domSelection(), range = document.createRange();
    if (!domSel) return;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const node = v.cursorWrapper.dom, img = node.nodeName == "IMG";
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (img) range.setStart(node.parentNode, domIndex(node) + 1);
    else range.setStart(node, 0);
    range.collapse(true);
    domSel.removeAllRanges();
    domSel.addRange(range);
    // Kludge to kill 'control selection' in IE11 when selecting an
    // invisible cursor wrapper, since that would result in those weird
    // resize handles and a selection that considers the absolutely
    // positioned wrapper, rather than the root editable node, the
    // focused element.
    if (!img && !v.state.selection.visible && _browserJs.browser.ie && _browserJs.browser.ie_version <= 11) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        node.disabled = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        node.disabled = false;
    }
}
function temporarilyEditableNear(view, pos) {
    const v = view;
    const { node , offset  } = v.docView.domFromPos(pos, 0);
    const after = offset < node.childNodes.length ? node.childNodes[offset] : null;
    const before = offset ? node.childNodes[offset - 1] : null;
    if (_browserJs.browser.safari && after && after.contentEditable == "false") return setEditable(after);
    if ((!after || after.contentEditable == "false") && (!before || before.contentEditable == "false")) {
        if (after) return setEditable(after);
        else if (before) return setEditable(before);
    }
    return;
}
function setEditable(element) {
    element.contentEditable = "true";
    if (_browserJs.browser.safari && element.draggable) {
        element.draggable = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        element.wasDraggable = true;
    }
    return element;
}
function resetEditable(element) {
    element.contentEditable = "false";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (element.wasDraggable) {
        element.draggable = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        element.wasDraggable = null;
    }
}
function removeClassOnSelectionChange(view) {
    const v = view;
    const doc = v.dom.ownerDocument;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    doc.removeEventListener("selectionchange", v.input.hideSelectionGuard);
    const domSel = v.domSelectionRange();
    const node = domSel.anchorNode, offset = domSel.anchorOffset;
    doc.addEventListener("selectionchange", v.input.hideSelectionGuard = ()=>{
        if (domSel.anchorNode != node || domSel.anchorOffset != offset) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            doc.removeEventListener("selectionchange", v.input.hideSelectionGuard);
            setTimeout(()=>{
                if (!editorOwnsSelection(v) || v.state.selection.visible) v.dom.classList.remove("ProseMirror-hideselection");
            }, 20);
        }
    });
}
const brokenSelectBetweenUneditable = _browserJs.browser.safari || _browserJs.browser.chrome && _browserJs.browser.chrome_version < 63;
function selectionToDOM(view) {
    let force = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
    const v = view;
    const sel = v.state.selection;
    syncNodeSelection(v, sel);
    if (!editorOwnsSelection(v)) return;
    // The delayed drag selection causes issues with Cell Selections
    // in Safari. And the drag selection delay is to workarond issues
    // which only present in Chrome.
    if (!force && v.input.mouseDown && v.input.mouseDown.allowDefault && _browserJs.browser.chrome) {
        const domSel = v.domSelectionRange(), curSel = v.domObserver.currentSelection;
        if (domSel.anchorNode && curSel.anchorNode && isEquivalentPosition(domSel.anchorNode, domSel.anchorOffset, curSel.anchorNode, curSel.anchorOffset)) {
            v.input.mouseDown.delayedSelectionSync = true;
            v.domObserver.setCurSelection();
            return;
        }
    }
    v.domObserver.disconnectSelection();
    if (v.cursorWrapper) {
        selectCursorWrapper(v);
    } else {
        const { anchor , head  } = sel;
        let resetEditableFrom;
        let resetEditableTo;
        if (brokenSelectBetweenUneditable && !(sel instanceof _prosemirrorState.TextSelection)) {
            if (!sel.$from.parent.inlineContent) resetEditableFrom = temporarilyEditableNear(v, sel.from);
            if (!sel.empty && !sel.$from.parent.inlineContent) resetEditableTo = temporarilyEditableNear(v, sel.to);
        }
        v.docView.setSelection(anchor, head, v.root, force);
        if (brokenSelectBetweenUneditable) {
            if (resetEditableFrom) resetEditable(resetEditableFrom);
            if (resetEditableTo) resetEditable(resetEditableTo);
        }
        if (sel.visible) {
            v.dom.classList.remove("ProseMirror-hideselection");
        } else {
            v.dom.classList.add("ProseMirror-hideselection");
            if ("onselectionchange" in document) removeClassOnSelectionChange(v);
        }
    }
    v.domObserver.setCurSelection();
    v.domObserver.connectSelection();
}
