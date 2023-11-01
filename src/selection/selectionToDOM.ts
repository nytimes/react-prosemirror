import { NodeSelection, Selection, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

import { browser } from "../browser.js";
import { NodeViewDesc } from "../viewdesc.js";

// Scans forward and backward through DOM positions equivalent to the
// given one to see if the two are in the same place (i.e. after a
// text node vs at the end of that text node)
export const isEquivalentPosition = function (
  node: Node,
  off: number,
  targetNode: Node,
  targetOff: number
) {
  return (
    targetNode &&
    (scanFor(node, off, targetNode, targetOff, -1) ||
      scanFor(node, off, targetNode, targetOff, 1))
  );
};

export function hasBlockDesc(dom: Node) {
  let desc;
  for (let cur: Node | null = dom; cur; cur = cur.parentNode)
    if ((desc = cur.pmViewDesc)) break;
  return (
    desc &&
    desc.node &&
    desc.node.isBlock &&
    (desc.dom == dom || desc.contentDOM == dom)
  );
}

const atomElements = /^(img|br|input|textarea|hr)$/i;

function scanFor(
  node: Node,
  off: number,
  targetNode: Node,
  targetOff: number,
  dir: number
) {
  for (;;) {
    if (node == targetNode && off == targetOff) return true;
    if (off == (dir < 0 ? 0 : nodeSize(node))) {
      const parent = node.parentNode;
      if (
        !parent ||
        parent.nodeType != 1 ||
        hasBlockDesc(node) ||
        atomElements.test(node.nodeName) ||
        (node as HTMLElement).contentEditable == "false"
      )
        return false;
      off = domIndex(node) + (dir < 0 ? 0 : 1);
      node = parent;
    } else if (node.nodeType == 1) {
      node = node.childNodes[off + (dir < 0 ? -1 : 0)]!;
      if ((node as HTMLElement).contentEditable == "false") return false;
      off = dir < 0 ? nodeSize(node) : 0;
    } else {
      return false;
    }
  }
}

export const domIndex = function (node: Node) {
  for (let index = 0; ; index++) {
    node = node.previousSibling!;
    if (!node) return index;
  }
};

export function nodeSize(node: Node) {
  return node.nodeType == 3 ? node.nodeValue!.length : node.childNodes.length;
}

export function syncNodeSelection(view: EditorView, sel: Selection) {
  if (sel instanceof NodeSelection) {
    const desc = view.docView.descAt(sel.from);
    if (desc != view.lastSelectedViewDesc) {
      clearNodeSelection(view);
      if (desc) (desc as NodeViewDesc).selectNode();
      view.lastSelectedViewDesc = desc;
    }
  } else {
    clearNodeSelection(view);
  }
}

// Clear all DOM statefulness of the last node selection.
function clearNodeSelection(view: EditorView) {
  if (view.lastSelectedViewDesc) {
    if (view.lastSelectedViewDesc.parent)
      (view.lastSelectedViewDesc as NodeViewDesc).deselectNode();
    view.lastSelectedViewDesc = undefined;
  }
}

export function hasSelection(view: EditorView) {
  const sel = view.domSelectionRange();
  if (!sel.anchorNode) return false;
  try {
    // Firefox will raise 'permission denied' errors when accessing
    // properties of `sel.anchorNode` when it's in a generated CSS
    // element.
    return (
      view.dom.contains(
        sel.anchorNode.nodeType == 3
          ? sel.anchorNode.parentNode
          : sel.anchorNode
      ) &&
      (view.editable ||
        view.dom.contains(
          sel.focusNode!.nodeType == 3
            ? sel.focusNode!.parentNode
            : sel.focusNode
        ))
    );
  } catch (_) {
    return false;
  }
}

function editorOwnsSelection(view: EditorView) {
  return view.editable
    ? view.hasFocus()
    : hasSelection(view) &&
        document.activeElement &&
        document.activeElement.contains(view.dom);
}

function selectCursorWrapper(view: EditorView) {
  const domSel = view.domSelection(),
    range = document.createRange();
  const node = view.cursorWrapper!.dom,
    img = node.nodeName == "IMG";
  if (img) range.setEnd(node.parentNode!, domIndex(node) + 1);
  else range.setEnd(node, 0);
  range.collapse(false);
  domSel.removeAllRanges();
  domSel.addRange(range);
  // Kludge to kill 'control selection' in IE11 when selecting an
  // invisible cursor wrapper, since that would result in those weird
  // resize handles and a selection that considers the absolutely
  // positioned wrapper, rather than the root editable node, the
  // focused element.
  if (
    !img &&
    !view.state.selection.visible &&
    browser.ie &&
    browser.ie_version <= 11
  ) {
    (node as any).disabled = true;
    (node as any).disabled = false;
  }
}

function temporarilyEditableNear(view: EditorView, pos: number) {
  const { node, offset } = view.docView.domFromPos(pos, 0);
  const after =
    offset < node.childNodes.length ? node.childNodes[offset] : null;
  const before = offset ? node.childNodes[offset - 1] : null;
  if (
    browser.safari &&
    after &&
    (after as HTMLElement).contentEditable == "false"
  )
    return setEditable(after as HTMLElement);
  if (
    (!after || (after as HTMLElement).contentEditable == "false") &&
    (!before || (before as HTMLElement).contentEditable == "false")
  ) {
    if (after) return setEditable(after as HTMLElement);
    else if (before) return setEditable(before as HTMLElement);
  }
}

function setEditable(element: HTMLElement) {
  element.contentEditable = "true";
  if (browser.safari && element.draggable) {
    element.draggable = false;
    (element as any).wasDraggable = true;
  }
  return element;
}

function resetEditable(element: HTMLElement) {
  element.contentEditable = "false";
  if ((element as any).wasDraggable) {
    element.draggable = true;
    (element as any).wasDraggable = null;
  }
}

function removeClassOnSelectionChange(view: EditorView) {
  const doc = view.dom.ownerDocument;
  doc.removeEventListener("selectionchange", view.input.hideSelectionGuard!);
  const domSel = view.domSelectionRange();
  const node = domSel.anchorNode,
    offset = domSel.anchorOffset;
  doc.addEventListener(
    "selectionchange",
    (view.input.hideSelectionGuard = () => {
      if (domSel.anchorNode != node || domSel.anchorOffset != offset) {
        doc.removeEventListener(
          "selectionchange",
          view.input.hideSelectionGuard!
        );
        setTimeout(() => {
          if (!editorOwnsSelection(view) || view.state.selection.visible)
            view.dom.classList.remove("ProseMirror-hideselection");
        }, 20);
      }
    })
  );
}

const brokenSelectBetweenUneditable =
  browser.safari || (browser.chrome && browser.chrome_version < 63);

export function selectionToDOM(view: EditorView, force = false) {
  const sel = view.state.selection;
  syncNodeSelection(view, sel);

  if (!editorOwnsSelection(view)) return;

  // The delayed drag selection causes issues with Cell Selections
  // in Safari. And the drag selection delay is to workarond issues
  // which only present in Chrome.
  if (
    !force &&
    view.input.mouseDown &&
    view.input.mouseDown.allowDefault &&
    browser.chrome
  ) {
    const domSel = view.domSelectionRange(),
      curSel = view.domObserver.currentSelection;
    if (
      domSel.anchorNode &&
      curSel.anchorNode &&
      isEquivalentPosition(
        domSel.anchorNode,
        domSel.anchorOffset,
        curSel.anchorNode,
        curSel.anchorOffset
      )
    ) {
      view.input.mouseDown.delayedSelectionSync = true;
      view.domObserver.setCurSelection();
      return;
    }
  }

  view.domObserver.disconnectSelection();

  if (view.cursorWrapper) {
    selectCursorWrapper(view);
  } else {
    const { anchor, head } = sel;
    let resetEditableFrom;
    let resetEditableTo;
    if (brokenSelectBetweenUneditable && !(sel instanceof TextSelection)) {
      if (!sel.$from.parent.inlineContent)
        resetEditableFrom = temporarilyEditableNear(view, sel.from);
      if (!sel.empty && !sel.$from.parent.inlineContent)
        resetEditableTo = temporarilyEditableNear(view, sel.to);
    }
    view.docView.setSelection(anchor, head, view.root, force);
    if (brokenSelectBetweenUneditable) {
      if (resetEditableFrom) resetEditable(resetEditableFrom);
      if (resetEditableTo) resetEditable(resetEditableTo);
    }
    if (sel.visible) {
      view.dom.classList.remove("ProseMirror-hideselection");
    } else {
      view.dom.classList.add("ProseMirror-hideselection");
      if ("onselectionchange" in document) removeClassOnSelectionChange(view);
    }
  }

  view.domObserver.setCurSelection();
  view.domObserver.connectSelection();
}
