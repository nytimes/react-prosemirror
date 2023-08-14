import { EditorView as EditorViewT } from "prosemirror-view";
import { useContext } from "react";

import { EditorViewContext } from "../contexts/EditorViewContext.js";
import { useLayoutGroupEffect } from "../contexts/LayoutGroup.js";

export function useView(effect: (view: EditorViewT) => void) {
  const view = useContext(EditorViewContext);
  useLayoutGroupEffect(() => {
    if (!view) return;
    return effect(view);
  });
}
