import { MutableRefObject, useEffect } from "react";

import { EditorViewInternal } from "../prosemirror-internal/EditorViewInternal.js";
import { initInput } from "../prosemirror-internal/input.js";

export function useContentEditable(
  viewRef: MutableRefObject<EditorViewInternal>
) {
  useEffect(() => {
    initInput(viewRef);

    function onBeforeInput(event: InputEvent) {
      switch (event.inputType) {
        case "insertText": {
          if (event.data === null) return;

          if (
            viewRef.current.someProp("handleTextInput")?.(
              viewRef.current,
              viewRef.current.state.selection.from,
              viewRef.current.state.selection.to,
              event.data
            )
          ) {
            event.preventDefault();
            break;
          }

          const { tr } = viewRef.current.state;
          tr.insertText(event.data);
          viewRef.current.dispatch(tr);
          event.preventDefault();
          break;
        }
        case "deleteContentBackward": {
          const { tr } = viewRef.current.state;
          tr.delete(
            viewRef.current.state.selection.empty
              ? viewRef.current.state.selection.from - 1
              : viewRef.current.state.selection.from,
            viewRef.current.state.selection.from
          );
          viewRef.current.dispatch(tr);
          event.preventDefault();
          break;
        }
      }
    }

    viewRef.current.dom.addEventListener("beforeinput", onBeforeInput);
  }, [viewRef]);
}
