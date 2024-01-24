import { ResolvedPos } from "prosemirror-model";
import { NodeSelection, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

import { isOnEdge, selectionCollapsed } from "../dom.js";
import { NodeViewDesc } from "../viewdesc.js";

export function selectionBetween(
  view: EditorView,
  $anchor: ResolvedPos,
  $head: ResolvedPos,
  bias?: number
) {
  return (
    view.someProp("createSelectionBetween", (f) => f(view, $anchor, $head)) ||
    TextSelection.between($anchor, $head, bias)
  );
}

export function selectionFromDOM(
  view: EditorView,
  origin: string | null = null
) {
  // @ts-expect-error Internal method
  const domSel = view.domSelectionRange(),
    doc = view.state.doc;
  if (!domSel.focusNode) return null;
  // @ts-expect-error Internel property
  let nearestDesc = view.docView.nearestDesc(domSel.focusNode);
  const inWidget = nearestDesc && nearestDesc.size == 0;
  // @ts-expect-error Internel property
  const head = view.docView.posFromDOM(domSel.focusNode, domSel.focusOffset, 1);
  if (head < 0) return null;
  const $head = doc.resolve(head);
  let $anchor, selection;
  if (selectionCollapsed(domSel)) {
    $anchor = $head;
    while (nearestDesc && !nearestDesc.node) nearestDesc = nearestDesc.parent;
    const nearestDescNode = (nearestDesc as NodeViewDesc).node;
    if (
      nearestDesc &&
      nearestDescNode.isAtom &&
      NodeSelection.isSelectable(nearestDescNode) &&
      nearestDesc.parent &&
      !(
        nearestDescNode.isInline &&
        isOnEdge(domSel.focusNode, domSel.focusOffset, nearestDesc.dom)
      )
    ) {
      const pos = nearestDesc.posBefore;
      selection = new NodeSelection(head == pos ? $head : doc.resolve(pos));
    }
  } else {
    // @ts-expect-error Internal property
    const anchor = view.docView.posFromDOM(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      domSel.anchorNode!,
      domSel.anchorOffset,
      1
    );
    if (anchor < 0) return null;
    $anchor = doc.resolve(anchor);
  }

  if (!selection) {
    const bias =
      origin == "pointer" ||
      (view.state.selection.head < $head.pos && !inWidget)
        ? 1
        : -1;
    selection = selectionBetween(view, $anchor, $head, bias);
  }
  return selection;
}
