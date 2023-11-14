import { Node } from "prosemirror-model";
import { EditorView } from "prosemirror-view";
import { useEffect, useRef } from "react";

import { keyEvent } from "../dom.js";

const SPACE = /\s/;
const PUNCTUATION =
  /[\u0021-\u0023\u0025-\u002A\u002C-\u002F\u003A\u003B\u003F\u0040\u005B-\u005D\u005F\u007B\u007D\u00A1\u00A7\u00AB\u00B6\u00B7\u00BB\u00BF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E3B\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]/;
const CHAMELEON = /['\u2018\u2019]/;

const isWordCharacter = (doc: Node, pos: number, checkDir = -1): boolean => {
  const $pos = doc.resolve(pos);

  // The position is at the beginning of a node
  if ($pos.parentOffset === 0) return false;

  const char = doc.textBetween(pos + checkDir, pos, null, " ");

  if (SPACE.test(char)) {
    return false;
  }

  // Chameleons count as word characters as long as they're in a word, so
  // recurse to see if the next one is a word character or not.
  if (CHAMELEON.test(char)) {
    if (isWordCharacter(doc, pos - 1)) {
      return true;
    }
  }

  if (PUNCTUATION.test(char)) {
    return false;
  }

  return true;
};

function insertText(
  view: EditorView,
  eventData: string | null,
  from?: number,
  to?: number
) {
  if (eventData === null) return false;

  if (
    view.someProp("handleTextInput")?.(
      view,
      view.state.selection.from,
      view.state.selection.to,
      eventData
    )
  ) {
    return true;
  }

  const { tr } = view.state;
  tr.insertText(eventData, from, to);
  view.dispatch(tr);
  return true;
}

function findWordBoundaryBackward(doc: Node, start: number) {
  let pos = start;
  while (!isWordCharacter(doc, pos)) {
    pos--;
  }
  while (isWordCharacter(doc, pos)) {
    pos--;
  }
  return pos;
}

function findWordBoundaryForward(doc: Node, start: number) {
  let pos = start;
  while (!isWordCharacter(doc, pos, 1)) {
    pos++;
  }
  while (isWordCharacter(doc, pos, 1)) {
    pos++;
  }
  return pos;
}

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

      if (insertText(view, compositionTextRef.current)) {
        event.preventDefault();
      }
      // @ts-expect-error Internal property (domObserver)
      view.domObserver.start();

      compositionTextRef.current = null;
    }

    function onBeforeInput(event: InputEvent) {
      if (!view) return;

      switch (event.inputType) {
        case "insertCompositionText": {
          if (event.data === null) return;

          compositionTextRef.current = event.data;
          break;
        }
        case "insertReplacementText": {
          const ranges = event.getTargetRanges();
          event.dataTransfer?.items[0]?.getAsString((data) => {
            for (const range of ranges) {
              // @ts-expect-error Internal property (docView)
              const from = view.docView.posFromDOM(
                range.startContainer,
                range.startOffset,
                1
              );
              // @ts-expect-error Internal property (docView)
              const to = view.docView.posFromDOM(
                range.endContainer,
                range.endOffset,
                1
              );
              insertText(view, data, from, to);
            }
          });
          // We have to unilaterally prevent default here, because there's no way
          // to synchronously check the contents of the data.
          event.preventDefault();
          break;
        }
        case "insertText": {
          if (insertText(view, event.data)) {
            event.preventDefault();
          }
          break;
        }
        case "deleteWordBackward": {
          const backspaceEvent = keyEvent(8, "Backspace");
          // @ts-expect-error We're constructing this event ourselves
          backspaceEvent.altKey = true;
          if (view.someProp("handleKeyDown", (f) => f(view, backspaceEvent))) {
            event.preventDefault();
            break;
          }

          const { tr, doc, selection } = view.state;
          const from = selection.empty
            ? findWordBoundaryBackward(view.state.doc, selection.from)
            : selection.from;
          const to = selection.to;
          const storedMarks = doc.resolve(from).marksAcross(doc.resolve(to));

          tr.delete(from, to).setStoredMarks(storedMarks);

          view.dispatch(tr);
          event.preventDefault();
          break;
        }
        case "deleteWordForward": {
          const deleteEvent = keyEvent(46, "Delete");
          // @ts-expect-error We're constructing this event ourselves
          deleteEvent.altKey = true;
          if (view.someProp("handleKeyDown", (f) => f(view, deleteEvent))) {
            event.preventDefault();
            break;
          }

          const { tr, doc, selection } = view.state;
          const from = selection.empty
            ? findWordBoundaryForward(view.state.doc, selection.from)
            : selection.from;
          const to = selection.to;
          const storedMarks = doc.resolve(from).marksAcross(doc.resolve(to));

          tr.delete(from, to).setStoredMarks(storedMarks);

          view.dispatch(tr);
          event.preventDefault();
          break;
        }
        case "deleteContentBackward": {
          if (
            view.someProp("handleKeyDown", (f) =>
              f(view, keyEvent(8, "Backspace"))
            )
          ) {
            break;
          }
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
          if (
            view.someProp("handleKeyDown", (f) =>
              f(view, keyEvent(46, "Delete"))
            )
          ) {
            break;
          }
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
