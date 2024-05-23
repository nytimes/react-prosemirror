import { EditorView } from "prosemirror-view";

import { browser } from "../browser.js";

export function findDirection(view: EditorView, pos: number): "rtl" | "ltr" {
  const $pos = view.state.doc.resolve(pos);
  if (!(browser.chrome || browser.windows) && $pos.parent.inlineContent) {
    const coords = view.coordsAtPos(pos);
    if (pos > $pos.start()) {
      const before = view.coordsAtPos(pos - 1);
      const mid = (before.top + before.bottom) / 2;
      if (
        mid > coords.top &&
        mid < coords.bottom &&
        Math.abs(before.left - coords.left) > 1
      )
        return before.left < coords.left ? "ltr" : "rtl";
    }
    if (pos < $pos.end()) {
      const after = view.coordsAtPos(pos + 1);
      const mid = (after.top + after.bottom) / 2;
      if (
        mid > coords.top &&
        mid < coords.bottom &&
        Math.abs(after.left - coords.left) > 1
      )
        return after.left > coords.left ? "ltr" : "rtl";
    }
  }
  const computed = getComputedStyle(view.dom).direction;
  return computed == "rtl" ? "rtl" : "ltr";
}
