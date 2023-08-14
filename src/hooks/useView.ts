import { useContext } from "react";

import { EditorViewContext } from "../contexts/EditorViewContext.js";
import { useLayoutGroupEffect } from "../contexts/LayoutGroup.js";
import { EditorView } from "../prosemirror-view/index.js";

export function useView(effect: (view: EditorView) => void) {
  const view = useContext(EditorViewContext);
  useLayoutGroupEffect(() => {
    if (!view) return;
    return effect(view);
  });
}
