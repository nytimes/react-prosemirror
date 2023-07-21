// TODO: There are some things that still need to be implemented with React here!
import { EditorState } from "prosemirror-state";
import { useContext } from "react";

import * as browser from "../browser.js";
import { EditorViewContext } from "../contexts/EditorViewContext.js";
import { NodeViewPositionsContext } from "../contexts/NodeViewPositionsContext.js";
import { singleRect, textRange } from "../dom.js";

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

function hasCaretPositionFromPoint(doc: Document): doc is Document & {
  caretPositionFromPoint: (
    x: number,
    y: number
  ) => { offsetNode: Node; offset: number };
} {
  return "caretPositionFromPoint" in doc;
}

function caretFromPoint(
  doc: Document,
  x: number,
  y: number
): { node: Node; offset: number } | undefined {
  if (hasCaretPositionFromPoint(doc)) {
    try {
      const pos = doc.caretPositionFromPoint(x, y);
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

function nearestNodeDom(start: Node, domNodes: Set<Node>) {
  let current: Node | null = start;
  while (current) {
    if (domNodes.has(current)) {
      return current;
    }
    current = current.parentNode;
  }
  return null;
}

function findOffsetInText(node: Text, coords: { top: number; left: number }) {
  const len = node.nodeValue!.length;
  const range = document.createRange();
  for (let i = 0; i < len; i++) {
    range.setEnd(node, i + 1);
    range.setStart(node, i);
    const rect = singleRect(range, 1);
    if (rect.top == rect.bottom) continue;
    if (inRect(coords, rect))
      return {
        node,
        offset: i + (coords.left >= (rect.left + rect.right) / 2 ? 1 : 0),
      };
  }
  return { node, offset: 0 };
}

function findOffsetInNode(
  node: HTMLElement,
  coords: { top: number; left: number }
): { node: Node; offset: number } {
  let closest,
    dxClosest = 2e8,
    coordsClosest: { left: number; top: number } | undefined,
    offset = 0;
  let rowBot = coords.top,
    rowTop = coords.top;
  let firstBelow: Node | undefined,
    coordsBelow: { left: number; top: number } | undefined;
  for (
    let child = node.firstChild, childIndex = 0;
    child;
    child = child.nextSibling, childIndex++
  ) {
    let rects;
    if (child.nodeType == 1) rects = (child as HTMLElement).getClientRects();
    else if (child.nodeType == 3)
      rects = textRange(child as Text).getClientRects();
    else continue;

    for (let i = 0; i < rects.length; i++) {
      const rect = rects[i]!;
      if (rect.top <= rowBot && rect.bottom >= rowTop) {
        rowBot = Math.max(rect.bottom, rowBot);
        rowTop = Math.min(rect.top, rowTop);
        const dx =
          rect.left > coords.left
            ? rect.left - coords.left
            : rect.right < coords.left
            ? coords.left - rect.right
            : 0;
        if (dx < dxClosest) {
          closest = child;
          dxClosest = dx;
          coordsClosest =
            dx && closest.nodeType == 3
              ? {
                  left: rect.right < coords.left ? rect.right : rect.left,
                  top: coords.top,
                }
              : coords;
          if (child.nodeType == 1 && dx)
            offset =
              childIndex +
              (coords.left >= (rect.left + rect.right) / 2 ? 1 : 0);
          continue;
        }
      } else if (
        rect.top > coords.top &&
        !firstBelow &&
        rect.left <= coords.left &&
        rect.right >= coords.left
      ) {
        firstBelow = child;
        coordsBelow = {
          left: Math.max(rect.left, Math.min(rect.right, coords.left)),
          top: rect.top,
        };
      }
      if (
        !closest &&
        ((coords.left >= rect.right && coords.top >= rect.top) ||
          (coords.left >= rect.left && coords.top >= rect.bottom))
      )
        offset = childIndex + 1;
    }
  }
  if (!closest && firstBelow) {
    closest = firstBelow;
    coordsClosest = coordsBelow;
    dxClosest = 0;
  }
  if (closest && closest.nodeType == 3)
    return findOffsetInText(closest as Text, coordsClosest!);
  if (!closest || (dxClosest && closest.nodeType == 1)) return { node, offset };
  return findOffsetInNode(closest as HTMLElement, coordsClosest!);
}

function posFromDOM(dom: Node, offset: number, bias: number): number {
  // If the DOM position is in the content, use the child desc after
  // it to figure out a position.
  // if (
  //   this.contentDOM &&
  //   this.contentDOM.contains(dom.nodeType == 1 ? dom : dom.parentNode)
  // ) {
  //   if (bias < 0) {
  //     let domBefore, desc: ViewDesc | undefined;
  //     if (dom == this.contentDOM) {
  //       domBefore = dom.childNodes[offset - 1];
  //     } else {
  //       while (dom.parentNode != this.contentDOM) dom = dom.parentNode!;
  //       domBefore = dom.previousSibling;
  //     }
  //     while (
  //       domBefore &&
  //       !((desc = domBefore.pmViewDesc) && desc.parent == this)
  //     )
  //       domBefore = domBefore.previousSibling;
  //     return domBefore
  //       ? this.posBeforeChild(desc!) + desc!.size
  //       : this.posAtStart;
  //   } else {
  //     let domAfter, desc: ViewDesc | undefined;
  //     if (dom == this.contentDOM) {
  //       domAfter = dom.childNodes[offset];
  //     } else {
  //       while (dom.parentNode != this.contentDOM) dom = dom.parentNode!;
  //       domAfter = dom.nextSibling;
  //     }
  //     while (domAfter && !((desc = domAfter.pmViewDesc) && desc.parent == this))
  //       domAfter = domAfter.nextSibling;
  //     return domAfter ? this.posBeforeChild(desc!) : this.posAtEnd;
  //   }
  // }
  // Otherwise, use various heuristics, falling back on the bias
  // parameter, to determine whether to return the position at the
  // start or at the end of this view desc.
  let atEnd;
  if (dom == this.dom && this.contentDOM) {
    atEnd = offset > domIndex(this.contentDOM);
  } else if (
    this.contentDOM &&
    this.contentDOM != this.dom &&
    this.dom.contains(this.contentDOM)
  ) {
    atEnd = dom.compareDocumentPosition(this.contentDOM) & 2;
  } else if (this.dom.firstChild) {
    if (offset == 0)
      for (let search = dom; ; search = search.parentNode!) {
        if (search == this.dom) {
          atEnd = false;
          break;
        }
        if (search.previousSibling) break;
      }
    if (atEnd == null && offset == dom.childNodes.length)
      for (let search = dom; ; search = search.parentNode!) {
        if (search == this.dom) {
          atEnd = true;
          break;
        }
        if (search.nextSibling) break;
      }
  }
  return (atEnd == null ? bias > 0 : atEnd) ? this.posAtEnd : this.posAtStart;
}

function posFromCaret(
  mount: HTMLDivElement,
  state: EditorState,
  node: Node,
  offset: number,
  coords: { top: number; left: number },
  domToPos: Map<Node, number>
) {
  const domNodes = new Set(domToPos.keys());
  // Browser (in caretPosition/RangeFromPoint) will agressively
  // normalize towards nearby inline nodes. Since we are interested in
  // positions between block nodes too, we first walk up the hierarchy
  // of nodes to see if there are block nodes that the coordinates
  // fall outside of. If so, we take the position before/after that
  // block. If not, we call `posFromDOM` on the raw node/offset.
  let outsideBlock = -1;
  for (let cur = node, sawBlock = false; ; ) {
    if (cur == mount) break;
    const nodeDom = nearestNodeDom(cur, domNodes);
    if (!nodeDom) return null;
    const nodePos = domToPos.get(nodeDom)!;
    const $nodePos = state.doc.resolve(nodePos);
    if (
      nodeDom.nodeType == 1 &&
      (($nodePos.nodeAfter?.isBlock && $nodePos.depth && !sawBlock) ||
        $nodePos.nodeAfter?.isAtom ||
        $nodePos.nodeAfter?.isLeaf)
    ) {
      const rect = (nodeDom as HTMLElement).getBoundingClientRect();
      if ($nodePos.nodeAfter?.isBlock && $nodePos.depth && !sawBlock) {
        sawBlock = true;
        if (rect.left > coords.left || rect.top > coords.top)
          outsideBlock = $nodePos.before();
        else if (rect.right < coords.left || rect.bottom < coords.top)
          outsideBlock = $nodePos.after();
      }
      if (
        ($nodePos.nodeAfter?.isAtom || $nodePos.nodeAfter?.isLeaf) &&
        outsideBlock < 0 &&
        !$nodePos.nodeAfter.isText
      ) {
        // If we are inside a leaf, return the side of the leaf closer to the coords
        const before = $nodePos.nodeAfter.isBlock
          ? coords.top < (rect.top + rect.bottom) / 2
          : coords.left < (rect.left + rect.right) / 2;
        return before ? $nodePos.before() : $nodePos.after();
      }
    }
    cur = nodeDom.parentNode!;
  }
  return outsideBlock > -1 ? outsideBlock : 0;
  // TODO: implement posFromDOM
  // : view.docView.posFromDOM(node, offset, -1);
}

function posFromElement(
  elt: HTMLElement,
  coords: { top: number; left: number }
) {
  const { node, offset } = findOffsetInNode(elt, coords);
  let bias = -1;
  if (node.nodeType == 1 && !node.firstChild) {
    const rect = (node as HTMLElement).getBoundingClientRect();
    bias =
      rect.left != rect.right && coords.left > (rect.left + rect.right) / 2
        ? 1
        : -1;
  }
  return view.docView.posFromDOM(node, offset, bias);
}

export function usePosAtCoords(coords: { top: number; left: number }) {
  const { mount, domToPos } = useContext(NodeViewPositionsContext);
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
      pos = posFromCaret(mount, state, node, offset, coords, domToPos);
  }
  if (pos == null) pos = posFromElement(elt, coords);

  const domNodes = new Set(domToPos.keys());
  const nodeDom = nearestNodeDom(elt, domNodes);
  if (!nodeDom) {
    return { pos, inside: -1 };
  }
  const nodePos = domToPos.get(nodeDom)!;
  const $nodePos = state.doc.resolve(nodePos);

  // TODO: 1 should actually be "border"
  return { pos, inside: $nodePos.before() - 1 };
}
