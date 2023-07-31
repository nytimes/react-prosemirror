import { EditorView as EditorViewT } from "prosemirror-view";
import { useContext } from "react";

import { EditorViewContext } from "../contexts/EditorViewContext.js";
import { useLayoutGroupEffect } from "../contexts/LayoutGroup.js";

export function useView(effect: (view: EditorViewT) => void) {
  const viewApiRef = useContext(EditorViewContext);
  useLayoutGroupEffect(() => {
    effect(viewApiRef.current);
  }, [effect, viewApiRef]);
}
