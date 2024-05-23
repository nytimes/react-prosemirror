import { Mark } from "prosemirror-model";
import { Plugin } from "prosemirror-state";
import { Decoration, EditorView } from "prosemirror-view";

import { CursorWrapper } from "../components/CursorWrapper.js";
import { widget } from "../decorations/ReactWidgetType.js";
import { getEdgeCharacterSize } from "../strings/characters.js";
import { findDirection } from "../strings/direction.js";
import {
  findWordBoundaryBackward,
  findWordBoundaryForward,
} from "../strings/words.js";

import { reactKeysPluginKey } from "./reactKeys.js";

function insertText(
  view: EditorView,
  eventData: string | null,
  options: {
    from?: number;
    to?: number;
    bust?: boolean;
    marks?: readonly Mark[] | null;
  } = {}
) {
  if (eventData === null) return false;

  const from = options.from ?? view.state.selection.from;
  const to = options.to ?? view.state.selection.to;

  if (view.someProp("handleTextInput", (f) => f(view, from, to, eventData))) {
    return true;
  }

  const { tr } = view.state;
  if (options.marks) tr.ensureMarks(options.marks);

  tr.insertText(eventData, from, to);

  if (options.bust) {
    const $from = view.state.doc.resolve(from);
    const sharedAncestorDepth = $from.sharedDepth(to);
    const sharedAncestorPos = $from.start(sharedAncestorDepth);

    const parentKey = reactKeysPluginKey
      .getState(view.state)
      ?.posToKey.get(sharedAncestorPos - 1);

    tr.setMeta(reactKeysPluginKey, {
      type: "bustKey",
      payload: { key: parentKey },
    });
  }

  view.dispatch(tr);
  return true;
}

export function beforeInputPlugin(
  setCursorWrapper: (deco: Decoration | null) => void
) {
  let compositionText: string | null = null;
  let compositionMarks: readonly Mark[] | null = null;
  return new Plugin({
    props: {
      handleDOMEvents: {
        compositionstart(view) {
          const { state } = view;

          view.dispatch(state.tr.deleteSelection());

          const $pos = state.selection.$from;

          if (
            state.selection.empty &&
            (state.storedMarks ||
              (!$pos.textOffset &&
                $pos.parentOffset &&
                $pos.nodeBefore?.marks.some(
                  (m) => m.type.spec.inclusive === false
                )))
          ) {
            setCursorWrapper(
              widget(state.selection.from, CursorWrapper, {
                key: "cursor-wrapper",
                marks: state.storedMarks ?? $pos.marks(),
              })
            );
          }
          compositionMarks = state.storedMarks ?? $pos.marks();

          // @ts-expect-error Internal property - input
          view.input.composing = true;
          return true;
        },
        compositionupdate() {
          return true;
        },
        compositionend(view) {
          // @ts-expect-error Internal property - input
          view.input.composing = false;
          if (compositionText === null) return;

          insertText(view, compositionText, {
            // TODO: Rather than busting the reactKey cache here,
            // which is pretty blunt and doesn't work for
            // multi-node replacements, we should attempt to
            // snapshot the selected DOM during compositionstart
            // and restore it before we end the composition.
            // This should allow React to successfully clean up
            // and insert the newly composed text, without requiring
            // any remounts
            bust: true,
            marks: compositionMarks,
          });

          compositionText = null;
          compositionMarks = null;
          setCursorWrapper(null);
          return true;
        },
        beforeinput(view, event) {
          event.preventDefault();
          switch (event.inputType) {
            case "insertCompositionText": {
              if (event.data === null) break;

              compositionText = event.data;
              break;
            }
            case "insertReplacementText": {
              const ranges = event.getTargetRanges();
              event.dataTransfer?.items[0]?.getAsString((data) => {
                for (const range of ranges) {
                  // @ts-expect-error Internal property - docView
                  const from = view.docView.posFromDOM(
                    range.startContainer,
                    range.startOffset,
                    1
                  );
                  // @ts-expect-error Internal property - docView
                  const to = view.docView.posFromDOM(
                    range.endContainer,
                    range.endOffset,
                    1
                  );
                  insertText(view, data, { from, to });
                }
              });
              break;
            }
            case "insertText": {
              insertText(view, event.data);
              break;
            }
            case "deleteWordBackward": {
              const { tr, doc, selection } = view.state;
              const from = selection.empty
                ? findWordBoundaryBackward(view.state.doc, selection.from)
                : selection.from;
              const to = selection.to;
              const storedMarks = doc
                .resolve(from)
                .marksAcross(doc.resolve(to));

              tr.delete(from, to).setStoredMarks(storedMarks);

              view.dispatch(tr);
              break;
            }
            case "deleteWordForward": {
              const { tr, doc, selection } = view.state;
              const from = selection.empty
                ? findWordBoundaryForward(view.state.doc, selection.from)
                : selection.from;
              const to = selection.to;
              const storedMarks = doc
                .resolve(from)
                .marksAcross(doc.resolve(to));

              tr.delete(from, to).setStoredMarks(storedMarks);

              view.dispatch(tr);
              break;
            }
            case "deleteContentBackward": {
              const { tr, doc, selection } = view.state;

              if (selection.empty) {
                const textNode = selection.$anchor.nodeBefore;
                const text = textNode?.text;
                if (!text) break;

                const characterSize = getEdgeCharacterSize(
                  text,
                  "trailing",
                  findDirection(view, selection.anchor) === "rtl"
                );

                const to = selection.to;
                const from = to - characterSize;
                const storedMarks = doc
                  .resolve(from)
                  .marksAcross(doc.resolve(to));

                tr.delete(from, to).setStoredMarks(storedMarks);
                view.dispatch(tr);
                break;
              }

              const from = selection.empty
                ? selection.from - 1
                : selection.from;
              const to = selection.to;
              const storedMarks = doc
                .resolve(from)
                .marksAcross(doc.resolve(to));

              tr.delete(from, to).setStoredMarks(storedMarks);

              view.dispatch(tr);
              break;
            }
            case "deleteContentForward": {
              const { tr, doc, selection } = view.state;
              if (selection.empty) {
                const textNode = selection.$anchor.nodeAfter;
                const text = textNode?.text;
                if (!text) break;

                const characterEnd = getEdgeCharacterSize(
                  text,
                  "leading",
                  findDirection(view, selection.anchor) === "rtl"
                );

                const from = selection.from;
                const to = from + characterEnd;
                const storedMarks = doc
                  .resolve(from)
                  .marksAcross(doc.resolve(to));

                tr.delete(from, to).setStoredMarks(storedMarks);
                view.dispatch(tr);
                break;
              }

              const from = selection.from;
              const to = selection.to;
              const storedMarks = doc
                .resolve(from)
                .marksAcross(doc.resolve(to));

              tr.delete(from, to).setStoredMarks(storedMarks);
              view.dispatch(tr);
              break;
            }
            case "deleteContent": {
              const { tr, doc, selection } = view.state;
              const storedMarks = doc
                .resolve(selection.from)
                .marksAcross(doc.resolve(selection.to));

              tr.delete(selection.from, selection.to).setStoredMarks(
                storedMarks
              );
              view.dispatch(tr);
              break;
            }
            default: {
              break;
            }
          }
          return true;
        },
      },
    },
  });
}
