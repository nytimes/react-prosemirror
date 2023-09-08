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
          const { tr, doc, selection } = view.state;
          const from = selection.empty ? selection.from - 1 : selection.from;
          const to = selection.to;
          const storedMarks = doc.resolve(from).marksAcross(doc.resolve(to));

          tr.delete(from, to).setStoredMarks(storedMarks);

          view.dispatch(tr);
          event.preventDefault();
          break;
        }
        case "deleteContentForward": {
          const { tr, doc, selection } = view.state;
          const from = selection.from;
          const to = selection.empty ? selection.to + 1 : selection.to;
          const storedMarks = doc.resolve(from).marksAcross(doc.resolve(to));

          tr.delete(from, to).setStoredMarks(storedMarks);
          event.preventDefault();
          break;
        }
        case "deleteContent": {
          const { tr, doc, selection } = view.state;
          const storedMarks = doc
            .resolve(selection.from)
            .marksAcross(doc.resolve(selection.to));

          tr.delete(selection.from, selection.to).setStoredMarks(storedMarks);
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
