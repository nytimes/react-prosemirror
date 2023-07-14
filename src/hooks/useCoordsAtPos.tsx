import { useContext } from "react";

import * as browser from "../browser.js";
import { EditorViewContext } from "../contexts/EditorViewContext.js";

import { useDomAtPos } from "./useDomAtPos.js";

const BIDI = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/;
function nonZero(rect: DOMRect) {
  return rect.top < rect.bottom || rect.left < rect.right;
}
function singleRect(target: HTMLElement | Range, bias: number): DOMRect {
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

const textRange = function (node: Text, from?: number, to?: number) {
  const range = reusedRange || (reusedRange = document.createRange());
  range.setEnd(node, to == null ? node.nodeValue!.length : to);
  range.setStart(node, from || 0);
  return range;
};
function flattenV(rect: DOMRect, left: boolean) {
  if (rect.width == 0) return rect;
  const x = left ? rect.left : rect.right;
  return { top: rect.top, bottom: rect.bottom, left: x, right: x };
}
function flattenH(rect: DOMRect, top: boolean) {
  if (rect.height == 0) return rect;
  const y = top ? rect.top : rect.bottom;
  return { top: y, bottom: y, left: rect.left, right: rect.right };
}

function nodeSize(node: Node) {
  return node.nodeType == 3 ? node.nodeValue!.length : node.childNodes.length;
}

export function useCoordsAtPos(
  pos: number,
  side = 1,
  effect: (coords: Record<"left" | "right" | "top" | "bottom", number>) => void
) {
  const { state } = useContext(EditorViewContext);
  useDomAtPos(pos, side, ({ node, offset }) => {
    function coordsAtPos() {
      const $pos = state.doc.resolve(pos);
      const atom = $pos.node().isAtom ? pos + 1 : undefined;

      const supportEmptyRange = browser.webkit || browser.gecko;
      if (node.nodeType == 3) {
        if (
          supportEmptyRange &&
          (BIDI.test(node.nodeValue!) ||
            (side < 0 ? !offset : offset == node.nodeValue!.length))
        ) {
          const rect = singleRect(
            textRange(node as Text, offset, offset),
            side
          );
          // Firefox returns bad results (the position before the space)
          // when querying a position directly after line-broken
          // whitespace. Detect this situation and and kludge around it
          if (
            browser.gecko &&
            offset &&
            /\s/.test(node.nodeValue![offset - 1]!) &&
            offset < node.nodeValue!.length
          ) {
            const rectBefore = singleRect(
              textRange(node as Text, offset - 1, offset - 1),
              -1
            );
            if (rectBefore.top == rect.top) {
              const rectAfter = singleRect(
                textRange(node as Text, offset, offset + 1),
                -1
              );
              if (rectAfter.top != rect.top)
                return flattenV(rectAfter, rectAfter.left < rectBefore.left);
            }
          }
          return rect;
        } else {
          let from = offset,
            to = offset,
            takeSide = side < 0 ? 1 : -1;
          if (side < 0 && !offset) {
            to++;
            takeSide = -1;
          } else if (side >= 0 && offset == node.nodeValue!.length) {
            from--;
            takeSide = 1;
          } else if (side < 0) {
            from--;
          } else {
            to++;
          }
          return flattenV(
            singleRect(textRange(node as Text, from, to), takeSide),
            takeSide < 0
          );
        }
      }

      const $dom = state.doc.resolve(pos - (atom || 0));
      // Return a horizontal line in block context
      if (!$dom.parent.inlineContent) {
        if (atom == null && offset && (side < 0 || offset == nodeSize(node))) {
          const before = node.childNodes[offset - 1]!;
          if (before.nodeType == 1)
            return flattenH(
              (before as HTMLElement).getBoundingClientRect(),
              false
            );
        }
        if (atom == null && offset < nodeSize(node)) {
          const after = node.childNodes[offset]!;
          if (after.nodeType == 1)
            return flattenH(
              (after as HTMLElement).getBoundingClientRect(),
              true
            );
        }
        return flattenH(
          (node as HTMLElement).getBoundingClientRect(),
          side >= 0
        );
      }

      // Inline, not in text node (this is not Bidi-safe)
      if (atom == null && offset && (side < 0 || offset == nodeSize(node))) {
        const before = node.childNodes[offset - 1]!;
        const target =
          before.nodeType == 3
            ? textRange(
                before as Text,
                nodeSize(before) - (supportEmptyRange ? 0 : 1)
              )
            : // BR nodes tend to only return the rectangle before them.

            // Only use them if they are the last element in their parent
            before.nodeType == 1 &&
              (before.nodeName != "BR" || !before.nextSibling)
            ? before
            : null;
        if (target)
          return flattenV(singleRect(target as Range | HTMLElement, 1), false);
      }
      if (atom == null && offset < nodeSize(node)) {
        let after = node.childNodes[offset]!;
        while (after.pmViewDesc && after.pmViewDesc.ignoreForCoords)
          after = after.nextSibling!;
        const target = !after
          ? null
          : after.nodeType == 3
          ? textRange(after as Text, 0, supportEmptyRange ? 0 : 1)
          : after.nodeType == 1
          ? after
          : null;
        if (target)
          return flattenV(singleRect(target as Range | HTMLElement, -1), true);
      }
      // All else failed, just try to get a rectangle for the target node
      return flattenV(
        singleRect(
          node.nodeType == 3 ? textRange(node as Text) : (node as HTMLElement),
          -side
        ),
        side >= 0
      );
    }
    effect(coordsAtPos());
  });
}
