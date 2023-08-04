import { MutableRefObject, useEffect } from "react";

import { EditorViewInternal } from "../prosemirror-internal/EditorViewInternal.js";

export function useContentEditable(
  viewRef: MutableRefObject<EditorViewInternal>
) {
  useEffect(() => {
    const attachedHandlers: Record<string, (e: Event) => void> = {};
    for (const [type, handler] of Object.entries(
      viewRef.current.someProp("handleDOMEvents") ?? {}
    )) {
      if (!handler) continue;
      const eventHandler = (event: Event) => {
        if (event.defaultPrevented) return;
        handler(viewRef.current, event);
      };

      attachedHandlers[type] = eventHandler;

      viewRef.current.dom.addEventListener(
        type as keyof HTMLElementEventMap,
        eventHandler
      );
    }

    function onKeyDown(event: KeyboardEvent) {
      if (viewRef.current.someProp("handleKeyDown")?.(viewRef.current, event)) {
        event.preventDefault();
      }
    }

    viewRef.current.dom.addEventListener("keydown", onKeyDown);

    function onKeyPress(event: KeyboardEvent) {
      if (
        viewRef.current.someProp("handleKeyPress")?.(viewRef.current, event)
      ) {
        event.preventDefault();
      }
    }

    viewRef.current.dom.addEventListener("keypress", onKeyPress);

    function onBeforeInput(event: InputEvent) {
      switch (event.inputType) {
        case "insertText": {
          if (event.data === null) return;

          if (
            viewRef.current.someProp("handleTextInput")?.(
              viewRef.current,
              viewRef.current.state.selection.from,
              viewRef.current.state.selection.to,
              event.data ?? ""
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

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      viewRef.current.dom.removeEventListener("beforeinput", onBeforeInput);
      for (const [type, handler] of Object.entries(attachedHandlers)) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        viewRef.current.dom.removeEventListener(type, handler);
      }
    };
  }, [viewRef]);
}
