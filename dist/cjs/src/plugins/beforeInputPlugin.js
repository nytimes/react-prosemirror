"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "beforeInputPlugin", {
    enumerable: true,
    get: function() {
        return beforeInputPlugin;
    }
});
const _prosemirrorstate = require("prosemirror-state");
const _CursorWrapper = require("../components/CursorWrapper.js");
const _ReactWidgetType = require("../decorations/ReactWidgetType.js");
const _reactKeys = require("./reactKeys.js");
function insertText(view, eventData) {
    let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    if (eventData === null) return false;
    const from = options.from ?? view.state.selection.from;
    const to = options.to ?? view.state.selection.to;
    if (view.someProp("handleTextInput", (f)=>f(view, from, to, eventData))) {
        return true;
    }
    const { tr } = view.state;
    if (options.marks) tr.ensureMarks(options.marks);
    tr.insertText(eventData, from, to);
    if (options.bust) {
        const $from = view.state.doc.resolve(from);
        const sharedAncestorDepth = $from.sharedDepth(to);
        const sharedAncestorPos = $from.start(sharedAncestorDepth);
        const parentKey = _reactKeys.reactKeysPluginKey.getState(view.state)?.posToKey.get(sharedAncestorPos - 1);
        tr.setMeta(_reactKeys.reactKeysPluginKey, {
            type: "bustKey",
            payload: {
                key: parentKey
            }
        });
    }
    view.dispatch(tr);
    return true;
}
function beforeInputPlugin(setCursorWrapper) {
    let compositionText = null;
    let compositionMarks = null;
    return new _prosemirrorstate.Plugin({
        props: {
            handleDOMEvents: {
                compositionstart (view) {
                    const { state } = view;
                    view.dispatch(state.tr.deleteSelection());
                    const $pos = state.selection.$from;
                    if (state.selection.empty && (state.storedMarks || !$pos.textOffset && $pos.parentOffset && $pos.nodeBefore?.marks.some((m)=>m.type.spec.inclusive === false))) {
                        setCursorWrapper((0, _ReactWidgetType.widget)(state.selection.from, _CursorWrapper.CursorWrapper, {
                            key: "cursor-wrapper",
                            marks: state.storedMarks ?? $pos.marks()
                        }));
                    }
                    compositionMarks = state.storedMarks ?? $pos.marks();
                    // @ts-expect-error Internal property - input
                    view.input.composing = true;
                    return true;
                },
                compositionupdate () {
                    return true;
                },
                compositionend (view) {
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
                        marks: compositionMarks
                    });
                    compositionText = null;
                    compositionMarks = null;
                    setCursorWrapper(null);
                    return true;
                },
                beforeinput (view, event) {
                    event.preventDefault();
                    switch(event.inputType){
                        case "insertCompositionText":
                            {
                                if (event.data === null) break;
                                compositionText = event.data;
                                break;
                            }
                        case "insertReplacementText":
                            {
                                const ranges = event.getTargetRanges();
                                event.dataTransfer?.items[0]?.getAsString((data)=>{
                                    for (const range of ranges){
                                        const from = view.posAtDOM(range.startContainer, range.startOffset, 1);
                                        const to = view.posAtDOM(range.endContainer, range.endOffset, 1);
                                        insertText(view, data, {
                                            from,
                                            to
                                        });
                                    }
                                });
                                break;
                            }
                        case "insertText":
                            {
                                insertText(view, event.data);
                                break;
                            }
                        case "deleteWordBackward":
                        case "deleteContentBackward":
                        case "deleteWordForward":
                        case "deleteContentForward":
                        case "deleteContent":
                            {
                                const targetRanges = event.getTargetRanges();
                                const { tr } = view.state;
                                for (const range of targetRanges){
                                    const start = view.posAtDOM(range.startContainer, range.startOffset);
                                    const end = view.posAtDOM(range.endContainer, range.endOffset);
                                    const { doc } = view.state;
                                    const storedMarks = doc.resolve(start).marksAcross(doc.resolve(end));
                                    tr.delete(start, end).setStoredMarks(storedMarks);
                                }
                                view.dispatch(tr);
                                break;
                            }
                        default:
                            {
                                break;
                            }
                    }
                    return true;
                }
            }
        }
    });
}
