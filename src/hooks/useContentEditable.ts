import {
  chainCommands,
  deleteSelection,
  joinBackward,
  selectNodeBackward,
} from "prosemirror-commands";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { useEffect, useRef } from "react";

export function useContentEditable(
  state: EditorState,
  dispatchTransaction: EditorView["dispatch"]
) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    function onBeforeInput(event: InputEvent) {
      event.preventDefault();

      switch (event.inputType) {
        case "insertText": {
          const { tr } = state;
          if (event.data !== null) {
            tr.insertText(event.data);
            dispatchTransaction(tr);
          }
          break;
        }
        case "deleteContentBackward": {
          const deleteContentBackward = chainCommands(
            deleteSelection,
            joinBackward,
            selectNodeBackward
          );
          deleteContentBackward(state, dispatchTransaction);
          break;
        }
      }
    }

    mount.addEventListener("beforeinput", onBeforeInput);

    return () => {
      mount.removeEventListener("beforeinput", onBeforeInput);
    };
  }, [dispatchTransaction, state]);

  return mountRef;
}