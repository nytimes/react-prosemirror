import { EditorState, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { MutableRefObject, useEffect } from "react";

export function useSyncSelection(
  state: EditorState,
  dispatchTransaction: EditorView["dispatch"],
  posToDOM: MutableRefObject<Map<number, Element | Text>>,
  domToPos: MutableRefObject<Map<Element | Text, number>>
) {
  useEffect(() => {
    function onSelectionChange() {
      const { doc, tr } = state;

      const domSelection = document.getSelection();
      if (!domSelection) return;

      const { anchorNode: initialAnchorNode, anchorOffset } = domSelection;
      if (!initialAnchorNode) return;

      let anchorNode = initialAnchorNode;
      while (!domToPos.current.has(anchorNode as Element)) {
        const parentNode = anchorNode.parentNode;
        if (!parentNode) return;
        anchorNode = parentNode;
      }

      const anchorPos = domToPos.current.get(anchorNode as Element);
      if (!anchorPos) return;

      const $anchor = doc.resolve(anchorPos + anchorOffset);

      const { focusNode: initialHeadNode, focusOffset } = domSelection;
      if (!initialHeadNode) return;

      let headNode = initialHeadNode;
      while (!domToPos.current.has(headNode as Element)) {
        const parentNode = headNode.parentNode;
        if (!parentNode) return;
        headNode = parentNode;
      }

      const headPos = domToPos.current.get(headNode as Element);
      if (!headPos) return;

      const $head = doc.resolve(headPos + focusOffset);

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
  }, [dispatchTransaction, domToPos, state]);

  useEffect(() => {
    const positions = Array.from(posToDOM.current.keys()).sort((a, b) => a - b);

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

    const anchorNode = posToDOM.current.get(anchorNodePos);
    const headNode = posToDOM.current.get(headNodePos);
    if (!anchorNode || !headNode) return;

    const domSelection = document.getSelection();
    domSelection?.setBaseAndExtent(
      anchorNode,
      state.selection.anchor - anchorNodePos,
      headNode,
      state.selection.head - headNodePos
    );
  }, [posToDOM, state]);
}
