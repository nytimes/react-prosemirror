import { EditorState, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { MutableRefObject, useEffect } from "react";

import { ViewDesc } from "../descriptors/ViewDesc.js";
import { DOMNode } from "../dom.js";

export function useSyncSelection(
  state: EditorState,
  dispatchTransaction: EditorView["dispatch"],
  posToDesc: MutableRefObject<Map<number, ViewDesc>>,
  domToDesc: MutableRefObject<Map<DOMNode, ViewDesc>>
) {
  useEffect(() => {
    function onSelectionChange() {
      const { doc, tr } = state;

      const domSelection = document.getSelection();
      if (!domSelection) return;

      const { anchorNode: initialAnchorNode, anchorOffset } = domSelection;
      if (!initialAnchorNode) return;

      let anchorNode = initialAnchorNode;
      const nodes = new Set(domToDesc.current.keys());
      while (!nodes.has(anchorNode)) {
        const parentNode = anchorNode.parentNode;
        if (!parentNode) return;
        anchorNode = parentNode;
      }

      const anchorDesc = domToDesc.current.get(anchorNode);
      if (!anchorDesc) return;

      const $anchor = doc.resolve(anchorDesc.posAtStart + anchorOffset);

      const { focusNode: initialHeadNode, focusOffset } = domSelection;
      if (!initialHeadNode) return;

      let headNode = initialHeadNode;
      while (!nodes.has(headNode)) {
        const parentNode = headNode.parentNode;
        if (!parentNode) return;
        headNode = parentNode;
      }

      const headDesc = domToDesc.current.get(headNode);
      if (!headDesc) return;

      const $head = doc.resolve(headDesc.posAtStart + focusOffset);

      const selection = TextSelection.between($anchor, $head);
      if (!state.selection.eq(selection)) {
        tr.setSelection(selection);
        dispatchTransaction(tr);
      }
    }

    document.addEventListener("selectionchange", onSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", onSelectionChange);
    };
  }, [dispatchTransaction, domToDesc, state]);

  useEffect(() => {
    const positions = Array.from(posToDesc.current.keys()).sort(
      (a, b) => a - b
    );

    let anchorNodePos = 0;
    for (const pos of positions) {
      if (pos > state.selection.anchor) break;

      anchorNodePos = pos;
    }
    let headNodePos = 0;
    for (const pos of positions) {
      if (pos > state.selection.head) break;

      headNodePos = pos;
    }

    const anchorDesc = posToDesc.current.get(anchorNodePos);
    const headDesc = posToDesc.current.get(headNodePos);
    if (!anchorDesc || !headDesc) return;

    const domSelection = document.getSelection();
    domSelection?.setBaseAndExtent(
      anchorDesc.dom,
      state.selection.anchor - anchorNodePos,
      headDesc.dom,
      state.selection.head - headNodePos
    );
  }, [posToDesc, state]);
}
