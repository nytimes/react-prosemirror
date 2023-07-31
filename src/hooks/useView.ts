import { EditorView as EditorViewT } from "prosemirror-view";
import { useContext } from "react";

import { EditorViewContext } from "../contexts/EditorViewContext.js";
import { useLayoutGroupEffect } from "../contexts/LayoutGroup.js";

export function useView(effect: (view: EditorViewT) => void) {
  const viewApiRef = useContext(EditorViewContext);
  useLayoutGroupEffect(() => {
    // @ts-expect-error TODO: Reconcile this type with the EditorView class
    effect(viewApiRef.current);
  }, [effect, viewApiRef]);
}
