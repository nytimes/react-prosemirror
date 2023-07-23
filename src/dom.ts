export type DOMNode = InstanceType<typeof window.Node>;
export type DOMSelection = InstanceType<typeof window.Selection>;
export type DOMSelectionRange = {
  focusNode: DOMNode | null;
  focusOffset: number;
  anchorNode: DOMNode | null;
  anchorOffset: number;
};

export const BIDI = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/;
export function nonZero(rect: DOMRect) {
  return rect.top < rect.bottom || rect.left < rect.right;
}
export function singleRect(target: HTMLElement | Range, bias: number): DOMRect {
  const rects = target.getClientRects();
  if (rects.length) {
    const first = rects[bias < 0 ? 0 : rects.length - 1]!;
    if (nonZero(first)) return first;
  }
  return (
    Array.prototype.find.call(rects, nonZero) || target.getBoundingClientRect()
  );
}
let reusedRange: Range | null = null;
// Note that this will always return the same range, because DOM range
// objects are every expensive, and keep slowing down subsequent DOM
// updates, for some reason.

export function textRange(node: Text, from?: number, to?: number) {
  const range = reusedRange || (reusedRange = document.createRange());
  range.setEnd(node, to == null ? node.nodeValue!.length : to);
  range.setStart(node, from || 0);
  return range;
}
export function flattenV(rect: DOMRect, left: boolean) {
  if (rect.width == 0) return rect;
  const x = left ? rect.left : rect.right;
  return { top: rect.top, bottom: rect.bottom, left: x, right: x };
}
export function flattenH(rect: DOMRect, top: boolean) {
  if (rect.height == 0) return rect;
  const y = top ? rect.top : rect.bottom;
  return { top: y, bottom: y, left: rect.left, right: rect.right };
}

export function nodeSize(node: Node) {
  return node.nodeType == 3 ? node.nodeValue!.length : node.childNodes.length;
}
