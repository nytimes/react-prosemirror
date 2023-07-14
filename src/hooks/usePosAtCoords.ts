// TODO: There are some things that still need to be implemented with React here!
import { useContext } from "react";

import * as browser from "../browser.js";
import { EditorViewContext } from "../contexts/EditorViewContext.js";
import { NodeViewPositionsContext } from "../contexts/NodeViewPositionsContext.js";

type Rect = { left: number; right: number; top: number; bottom: number };

export const parentNode = function (node: Node): Node | null {
  const parent = (node as HTMLSlotElement).assignedSlot || node.parentNode;
  return parent && parent.nodeType == 11 ? (parent as ShadowRoot).host : parent;
};

function targetKludge(dom: HTMLElement, coords: { top: number; left: number }) {
  const parent = dom.parentNode;
  if (
    parent &&
    /^li$/i.test(parent.nodeName) &&
    coords.left < dom.getBoundingClientRect().left
  )
    return parent as HTMLElement;
  return dom;
}

function caretFromPoint(
  doc: Document,
  x: number,
  y: number
): { node: Node; offset: number } | undefined {
  if ((doc as any).caretPositionFromPoint) {
    try {
      const pos = (doc as any).caretPositionFromPoint(x, y);
      if (pos) return { node: pos.offsetNode, offset: pos.offset };
    } catch (_) {
      // Firefox throws for this call in hard-to-predict circumstances (#994)
    }
  }
  if (doc.caretRangeFromPoint) {
    const range = doc.caretRangeFromPoint(x, y);
    if (range) return { node: range.startContainer, offset: range.startOffset };
  }
  return;
}

function inRect(coords: { top: number; left: number }, rect: Rect) {
  return (
    coords.left >= rect.left - 1 &&
    coords.left <= rect.right + 1 &&
    coords.top >= rect.top - 1 &&
    coords.top <= rect.bottom + 1
  );
}

function elementFromPoint(
  element: HTMLElement,
  coords: { top: number; left: number },
  box: Rect
): HTMLElement {
  const len = element.childNodes.length;
  if (len && box.top < box.bottom) {
    for (
      let startI = Math.max(
          0,
          Math.min(
            len - 1,
            Math.floor(
              (len * (coords.top - box.top)) / (box.bottom - box.top)
            ) - 2
          )
        ),
        i = startI;
      ;

    ) {
      const child = element.childNodes[i]!;
      if (child.nodeType == 1) {
        const rects = (child as HTMLElement).getClientRects();
        for (let j = 0; j < rects.length; j++) {
          const rect = rects[j]!;
          if (inRect(coords, rect))
            return elementFromPoint(child as HTMLElement, coords, rect);
        }
      }
      if ((i = (i + 1) % len) == startI) break;
    }
  }
  return element;
}

function posFromCaret(
  mount: HTMLDivElement,
  node: Node,
  offset: number,
  coords: { top: number; left: number }
) {
  // Browser (in caretPosition/RangeFromPoint) will agressively
  // normalize towards nearby inline nodes. Since we are interested in
  // positions between block nodes too, we first walk up the hierarchy
  // of nodes to see if there are block nodes that the coordinates
  // fall outside of. If so, we take the position before/after that
  // block. If not, we call `posFromDOM` on the raw node/offset.
  let outsideBlock = -1;
  for (let cur = node, sawBlock = false; ; ) {
    if (cur == mount) break;
    const desc = view.docView.nearestDesc(cur, true);
    if (!desc) return null;
    if (
      desc.dom.nodeType == 1 &&
      ((desc.node.isBlock && desc.parent && !sawBlock) || !desc.contentDOM)
    ) {
      const rect = (desc.dom as HTMLElement).getBoundingClientRect();
      if (desc.node.isBlock && desc.parent && !sawBlock) {
        sawBlock = true;
        if (rect.left > coords.left || rect.top > coords.top)
          outsideBlock = desc.posBefore;
        else if (rect.right < coords.left || rect.bottom < coords.top)
          outsideBlock = desc.posAfter;
      }
      if (!desc.contentDOM && outsideBlock < 0 && !desc.node.isText) {
        // If we are inside a leaf, return the side of the leaf closer to the coords
        const before = desc.node.isBlock
          ? coords.top < (rect.top + rect.bottom) / 2
          : coords.left < (rect.left + rect.right) / 2;
        return before ? desc.posBefore : desc.posAfter;
      }
    }
    cur = desc.dom.parentNode!;
  }
  return outsideBlock > -1
    ? outsideBlock
    : view.docView.posFromDOM(node, offset, -1);
}

export function usePosAtCoords(coords: { top: number; left: number }) {
  const { mount } = useContext(NodeViewPositionsContext);
  const { state } = useContext(EditorViewContext);

  if (!mount) return -1;

  const document = mount.ownerDocument;
  let node: Node | undefined,
    offset = 0;
  const caret = caretFromPoint(document, coords.left, coords.top);
  if (caret) ({ node, offset } = caret);

  let elt = document.elementFromPoint(coords.left, coords.top) as HTMLElement;
  let pos;
  if (!elt || !mount.contains(elt.nodeType != 1 ? elt.parentNode : elt)) {
    const box = mount.getBoundingClientRect();
    if (!inRect(coords, box)) return null;
    elt = elementFromPoint(mount, coords, box);
    if (!elt) return null;
  }
  // Safari's caretRangeFromPoint returns nonsense when on a draggable element
  if (browser.safari) {
    for (let p: Node | null = elt; node && p; p = parentNode(p))
      if ((p as HTMLElement).draggable) node = undefined;
  }
  elt = targetKludge(elt, coords);
  if (node) {
    if (browser.gecko && node.nodeType == 1) {
      // Firefox will sometimes return offsets into <input> nodes, which
      // have no actual children, from caretPositionFromPoint (#953)
      offset = Math.min(offset, node.childNodes.length);
      // It'll also move the returned position before image nodes,
      // even if those are behind it.
      if (offset < node.childNodes.length) {
        const next = node.childNodes[offset]!;
        let box;
        if (
          next.nodeName == "IMG" &&
          (box = (next as HTMLElement).getBoundingClientRect()).right <=
            coords.left &&
          box.bottom > coords.top
        )
          offset++;
      }
    }
    // Suspiciously specific kludge to work around caret*FromPoint
    // never returning a position at the end of the document
    if (
      node == mount &&
      offset == node.childNodes.length - 1 &&
      node.lastChild!.nodeType == 1 &&
      coords.top >
        (node.lastChild as HTMLElement).getBoundingClientRect().bottom
    )
      pos = state.doc.content.size;
    // Ignore positions directly after a BR, since caret*FromPoint
    // 'round up' positions that would be more accurately placed
    // before the BR node.
    else if (
      offset == 0 ||
      node.nodeType != 1 ||
      node.childNodes[offset - 1]!.nodeName != "BR"
    )
      pos = posFromCaret(mount, node, offset, coords);
  }
  if (pos == null) pos = posFromElement(view, elt, coords);

  const desc = view.docView.nearestDesc(elt, true);
  return { pos, inside: desc ? desc.posAtStart - desc.border : -1 };
}
