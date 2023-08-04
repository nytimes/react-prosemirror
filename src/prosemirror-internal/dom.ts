/**
 * @fileoverview
 * Copied directly from
 * https://github.com/ProseMirror/prosemirror-view/blob/f6d96de9f2714bcf97d6ca9b0906d8750a142d1b/src/dom.ts
 */
import { EditorViewInternal as EditorView } from "./EditorViewInternal.js"

export type DOMNode = InstanceType<typeof window.Node>
export type DOMSelection = InstanceType<typeof window.Selection>
export type DOMSelectionRange = {
  focusNode: DOMNode | null, focusOffset: number,
  anchorNode: DOMNode | null, anchorOffset: number
}

export const domIndex = function(node: Node) {
  for (var index = 0;; index++) {
    node = node.previousSibling!
    if (!node) return index
  }
}

export const parentNode = function(node: Node): Node | null {
  let parent = (node as HTMLSlotElement).assignedSlot || node.parentNode
  return parent && parent.nodeType == 11 ? (parent as ShadowRoot).host : parent
}

let reusedRange: Range | null = null

// Note that this will always return the same range, because DOM range
// objects are every expensive, and keep slowing down subsequent DOM
// updates, for some reason.
export const textRange = function(node: Text, from?: number, to?: number) {
  let range = reusedRange || (reusedRange = document.createRange())
  range.setEnd(node, to == null ? node.nodeValue!.length : to)
  range.setStart(node, from || 0)
  return range
}

// Scans forward and backward through DOM positions equivalent to the
// given one to see if the two are in the same place (i.e. after a
// text node vs at the end of that text node)
export const isEquivalentPosition = function(node: Node, off: number, targetNode: Node, targetOff: number) {
  return targetNode && (scanFor(node, off, targetNode, targetOff, -1) ||
                        scanFor(node, off, targetNode, targetOff, 1))
}

const atomElements = /^(img|br|input|textarea|hr)$/i

function scanFor(node: Node, off: number, targetNode: Node, targetOff: number, dir: number) {
  for (;;) {
    if (node == targetNode && off == targetOff) return true
    if (off == (dir < 0 ? 0 : nodeSize(node))) {
      let parent = node.parentNode
      if (!parent || parent.nodeType != 1 || hasBlockDesc(node) || atomElements.test(node.nodeName) ||
          (node as HTMLElement).contentEditable == "false")
        return false
      off = domIndex(node) + (dir < 0 ? 0 : 1)
      node = parent
    } else if (node.nodeType == 1) {
      // @ts-expect-error
      node = node.childNodes[off + (dir < 0 ? -1 : 0)]
      if ((node as HTMLElement).contentEditable == "false") return false
      off = dir < 0 ? nodeSize(node) : 0
    } else {
      return false
    }
  }
}

export function nodeSize(node: Node) {
  return node.nodeType == 3 ? node.nodeValue!.length : node.childNodes.length
}

// @ts-expect-error
export function isOnEdge(node: Node, offset: number, parent: Node) {
  for (let atStart = offset == 0, atEnd = offset == nodeSize(node); atStart || atEnd;) {
    if (node == parent) return true
    let index = domIndex(node)
    node = node.parentNode!
    if (!node) return false
    atStart = atStart && index == 0
    atEnd = atEnd && index == nodeSize(node)
  }
}

export function hasBlockDesc(dom: Node) {
  let desc
  for (let cur: Node | null = dom; cur; cur = cur.parentNode) if (desc = cur.pmViewDesc) break
  return desc && desc.node && desc.node.isBlock && (desc.dom == dom || desc.contentDOM == dom)
}

// Work around Chrome issue https://bugs.chromium.org/p/chromium/issues/detail?id=447523
// (isCollapsed inappropriately returns true in shadow dom)
export const selectionCollapsed = function(domSel: DOMSelectionRange) {
  return domSel.focusNode && isEquivalentPosition(domSel.focusNode, domSel.focusOffset,
                                                  domSel.anchorNode!, domSel.anchorOffset)
}

export function keyEvent(keyCode: number, key: string) {
  let event = document.createEvent("Event") as KeyboardEvent
  event.initEvent("keydown", true, true)
  ;(event as any).keyCode = keyCode
  ;(event as any).key = (event as any).code = key
  return event
}

export function deepActiveElement(doc: Document) {
  let elt = doc.activeElement
  while (elt && elt.shadowRoot) elt = elt.shadowRoot.activeElement
  return elt
}

// @ts-expect-error
export function caretFromPoint(doc: Document, x: number, y: number): {node: Node, offset: number} | undefined {
  if ((doc as any).caretPositionFromPoint) {
    try { // Firefox throws for this call in hard-to-predict circumstances (#994)
      let pos = (doc as any).caretPositionFromPoint(x, y)
      if (pos) return {node: pos.offsetNode, offset: pos.offset}
    } catch (_) {}
  }
  if (doc.caretRangeFromPoint) {
    let range = doc.caretRangeFromPoint(x, y)
    if (range) return {node: range.startContainer, offset: range.startOffset}
  }
}

// $$FORK: originally from domobserver.ts
export function safariShadowSelectionRange(view: EditorView): DOMSelectionRange {
  let found: StaticRange | undefined
  function read(event: InputEvent) {
    event.preventDefault()
    event.stopImmediatePropagation()
    found = event.getTargetRanges()[0]
  }

  // Because Safari (at least in 2018-2022) doesn't provide regular
  // access to the selection inside a shadowRoot, we have to perform a
  // ridiculous hack to get at it—using `execCommand` to trigger a
  // `beforeInput` event so that we can read the target range from the
  // event.
  view.dom.addEventListener("beforeinput", read, true)
  document.execCommand("indent")
  view.dom.removeEventListener("beforeinput", read, true)

  let anchorNode = found!.startContainer, anchorOffset = found!.startOffset
  let focusNode = found!.endContainer, focusOffset = found!.endOffset

  let currentAnchor = view.domAtPos(view.state.selection.anchor)
  // Since such a range doesn't distinguish between anchor and head,
  // use a heuristic that flips it around if its end matches the
  // current anchor.
  if (isEquivalentPosition(currentAnchor.node, currentAnchor.offset, focusNode, focusOffset))
    [anchorNode, anchorOffset, focusNode, focusOffset] = [focusNode, focusOffset, anchorNode, anchorOffset]
  return {anchorNode, anchorOffset, focusNode, focusOffset}
}
