import { useEffect } from "react";

import { EditorView } from "../prosemirror-view/index.js";

export function useContentEditable(view: EditorView | null) {
  useEffect(() => {
    if (!view) return;

    function onBeforeInput(event: InputEvent) {
      if (!view) return;

      switch (event.inputType) {
        case "insertText": {
          if (event.data === null) return;

          if (
            view.someProp("handleTextInput")?.(
              view,
              view.state.selection.from,
              view.state.selection.to,
              event.data
            )
          ) {
            event.preventDefault();
            break;
          }

          const { tr } = view.state;
          tr.insertText(event.data);
          view.dispatch(tr);
          event.preventDefault();
          break;
        }
        case "deleteContentBackward": {
          const { tr } = view.state;
          tr.delete(
            view.state.selection.empty
              ? view.state.selection.from - 1
              : view.state.selection.from,
            view.state.selection.from
          );
          view.dispatch(tr);
          event.preventDefault();
          break;
        }
        default: {
          event.preventDefault();
          break;
        }
      }
    }

    view.dom.addEventListener("beforeinput", onBeforeInput);
    return () => view.dom.removeEventListener("beforeinput", onBeforeInput);
  }, [view]);
}
