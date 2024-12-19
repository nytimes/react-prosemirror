import { NodeSelection, Selection, TextSelection } from "prosemirror-state";
import { Decoration, EditorView } from "prosemirror-view";

import { browser } from "../browser.js";
import { DOMNode, DOMSelection } from "../dom.js";
import { NodeViewDesc, ViewDesc } from "../viewdesc.js";

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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      node = node.childNodes[off + (dir < 0 ? -1 : 0)]!;
      if ((node as HTMLElement).contentEditable == "false") return false;
      off = dir < 0 ? nodeSize(node) : 0;
    } else {
      return false;
    }
  }
}

export const domIndex = function (node: Node) {
  let n: Node | null = node;
  for (let index = 0; ; index++) {
    n = n.previousSibling;
    if (!n) return index;
  }
};

export function nodeSize(node: Node) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return node.nodeType == 3 ? node.nodeValue!.length : node.childNodes.length;
}

interface InternalView extends EditorView {
  docView: ViewDesc;
  lastSelectedViewDesc: ViewDesc | undefined;
  domSelectionRange(): {
    focusNode: DOMNode | null;
    focusOffset: number;
    anchorNode: DOMNode | null;
    anchorOffset: number;
  };
  domSelection(): DOMSelection;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  domObserver: any;
  cursorWrapper: { dom: DOMNode; deco: Decoration } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any;
}

export function syncNodeSelection(view: EditorView, sel: Selection) {
  const v = view as InternalView;
  if (sel instanceof NodeSelection) {
    const desc = v.docView.descAt(sel.from);
    if (desc != v.lastSelectedViewDesc) {
      clearNodeSelection(v);
      if (desc) (desc as NodeViewDesc).selectNode();
      v.lastSelectedViewDesc = desc;
    }
  } else {
    clearNodeSelection(v);
  }
}

// Clear all DOM statefulness of the last node selection.
function clearNodeSelection(view: EditorView) {
  const v = view as InternalView;
  if (v.lastSelectedViewDesc) {
    if (v.lastSelectedViewDesc.parent)
      (v.lastSelectedViewDesc as NodeViewDesc).deselectNode();
    v.lastSelectedViewDesc = undefined;
  }
}

export function hasSelection(view: EditorView) {
  const v = view as InternalView;
  const sel = v.domSelectionRange();
  if (!sel.anchorNode) return false;
  try {
    // Firefox will raise 'permission denied' errors when accessing
    // properties of `sel.anchorNode` when it's in a generated CSS
    // element.
    return (
      v.dom.contains(
        sel.anchorNode.nodeType == 3
          ? sel.anchorNode.parentNode
          : sel.anchorNode
      ) &&
      (v.editable ||
        v.dom.contains(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          sel.focusNode!.nodeType == 3
            ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              sel.focusNode!.parentNode
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
  const v = view as InternalView;
  const domSel = v.domSelection(),
    range = document.createRange();
  if (!domSel) return;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const node = v.cursorWrapper!.dom,
    img = node.nodeName == "IMG";
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  if (img) range.setStart(node.parentNode!, domIndex(node) + 1);
  else range.setStart(node, 0);
  range.collapse(true);
  domSel.removeAllRanges();
  domSel.addRange(range);
  // Kludge to kill 'control selection' in IE11 when selecting an
  // invisible cursor wrapper, since that would result in those weird
  // resize handles and a selection that considers the absolutely
  // positioned wrapper, rather than the root editable node, the
  // focused element.
  if (
    !img &&
    !v.state.selection.visible &&
    browser.ie &&
    browser.ie_version <= 11
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node as any).disabled = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node as any).disabled = false;
  }
}

function temporarilyEditableNear(view: EditorView, pos: number) {
  const v = view as InternalView;
  const { node, offset } = v.docView.domFromPos(pos, 0);
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
  return;
}

function setEditable(element: HTMLElement) {
  element.contentEditable = "true";
  if (browser.safari && element.draggable) {
    element.draggable = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (element as any).wasDraggable = true;
  }
  return element;
}

function resetEditable(element: HTMLElement) {
  element.contentEditable = "false";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((element as any).wasDraggable) {
    element.draggable = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (element as any).wasDraggable = null;
  }
}

function removeClassOnSelectionChange(view: EditorView) {
  const v = view as InternalView;
  const doc = v.dom.ownerDocument;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  doc.removeEventListener("selectionchange", v.input.hideSelectionGuard!);
  const domSel = v.domSelectionRange();
  const node = domSel.anchorNode,
    offset = domSel.anchorOffset;
  doc.addEventListener(
    "selectionchange",
    (v.input.hideSelectionGuard = () => {
      if (domSel.anchorNode != node || domSel.anchorOffset != offset) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        doc.removeEventListener("selectionchange", v.input.hideSelectionGuard!);
        setTimeout(() => {
          if (!editorOwnsSelection(v) || v.state.selection.visible)
            v.dom.classList.remove("ProseMirror-hideselection");
        }, 20);
      }
    })
  );
}

const brokenSelectBetweenUneditable =
  browser.safari || (browser.chrome && browser.chrome_version < 63);

export function selectionToDOM(view: EditorView, force = false) {
  const v = view as InternalView;
  const sel = v.state.selection;
  syncNodeSelection(v, sel);

  if (!editorOwnsSelection(v)) return;

  // The delayed drag selection causes issues with Cell Selections
  // in Safari. And the drag selection delay is to workarond issues
  // which only present in Chrome.
  if (
    !force &&
    v.input.mouseDown &&
    v.input.mouseDown.allowDefault &&
    browser.chrome
  ) {
    const domSel = v.domSelectionRange(),
      curSel = v.domObserver.currentSelection;
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
      v.input.mouseDown.delayedSelectionSync = true;
      v.domObserver.setCurSelection();
      return;
    }
  }

  v.domObserver.disconnectSelection();

  if (v.cursorWrapper) {
    selectCursorWrapper(v);
  } else {
    const { anchor, head } = sel;
    let resetEditableFrom;
    let resetEditableTo;
    if (brokenSelectBetweenUneditable && !(sel instanceof TextSelection)) {
      if (!sel.$from.parent.inlineContent)
        resetEditableFrom = temporarilyEditableNear(v, sel.from);
      if (!sel.empty && !sel.$from.parent.inlineContent)
        resetEditableTo = temporarilyEditableNear(v, sel.to);
    }
    v.docView.setSelection(anchor, head, v, force);
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
