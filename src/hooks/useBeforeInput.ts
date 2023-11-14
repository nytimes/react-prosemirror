import { EditorView } from "prosemirror-view";
import { useEffect, useRef } from "react";

export function useBeforeInput(view: EditorView | null) {
  const compositionTextRef = useRef<string | null>(null);
  useEffect(() => {
    if (!view) return;

    function onCompositionStart() {
      // @ts-expect-error Internal property (domObserver)
      view?.domObserver.stop();
    }

    function onCompositionEnd(event: CompositionEvent) {
      if (!view) return;
      if (compositionTextRef.current === null) return;

      if (
        view.someProp("handleTextInput")?.(
          view,
          view.state.selection.from,
          view.state.selection.to,
          event.data
        )
      ) {
        event.preventDefault();
        // @ts-expect-error Internal property (domObserver)
        view.domObserver.start();
        return;
      }

      const { tr } = view.state;
      tr.insertText(event.data);
      view.dispatch(tr);
      event.preventDefault();
      // @ts-expect-error Internal property (domObserver)
      view.domObserver.start();
    }

    function onBeforeInput(event: InputEvent) {
      if (!view) return;

      switch (event.inputType) {
        case "insertCompositionText": {
          if (event.data === null) return;

          compositionTextRef.current = event.data;
          break;
        }
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
    view.dom.addEventListener("compositionend", onCompositionEnd);
    view.dom.addEventListener("compositionstart", onCompositionStart);

    return () => {
      view.dom.removeEventListener("compositionstart", onCompositionStart);
      view.dom.removeEventListener("compositionend", onCompositionEnd);
      view.dom.removeEventListener("beforeinput", onBeforeInput);
    };
  }, [view]);
}
