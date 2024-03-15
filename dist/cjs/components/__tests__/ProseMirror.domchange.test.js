/**
 * @fileoverview
 * This file tests that prosemirror-view's DOMObserver works correctly
 * in conjunction with React ProseMirror.
 *
 * @important
 * DOMObserver relies on a MutationObserver. The MutationObserver callback
 * seems to get queued as a microtask; it will not run until after all
 * synchronous code in a test has completed. This is why we manually call
 * flush(view) in each test to ensure that the mutation records have been
 * flushed.
 *
 * HOWEVER! If you use an awaited statement after changing the DOM, the
 * MutationObserver WILL run. This means that a sequence of DOM changes
 * that you want to be staged and detected as a single change may be
 * detected and processed in multiple separate phases, which can lead to
 * unexpected results. Unsure that you only have synchronous code between
 * your first DOM change and your eventual call to flush(view) to avoid this.
 */ /* eslint-disable @typescript-eslint/no-explicit-any */ /* eslint-disable @typescript-eslint/no-non-null-assertion */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _globals = require("@jest/globals");
const _react = require("@testing-library/react");
const _userEvent = /*#__PURE__*/ _interopRequireDefault(require("@testing-library/user-event"));
const _prosemirrorState = require("prosemirror-state");
const _prosemirrorTestBuilder = require("prosemirror-test-builder");
const _editorViewTestHelpersJs = require("../../testing/editorViewTestHelpers.js");
const _setupProseMirrorViewJs = require("../../testing/setupProseMirrorView.js");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const img = (0, _prosemirrorTestBuilder.img)({
    src: "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
});
function flush(view) {
    (0, _react.act)(()=>{
        view.domObserver.flush();
    });
}
function setSel(aNode, aOff, fNode) {
    let fOff = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 0;
    const r = document.createRange();
    const s = window.getSelection();
    r.setEnd(fNode || aNode, fNode ? fOff : aOff);
    r.setStart(aNode, aOff);
    s.removeAllRanges();
    s.addRange(r);
}
describe("DOM change", ()=>{
    beforeAll(()=>{
        (0, _setupProseMirrorViewJs.setupProseMirrorView)();
    });
    it("notices when text is added", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("hello"))
        });
        (0, _editorViewTestHelpersJs.findTextNode)(view.dom, "hello").nodeValue = "heLllo";
        flush(view);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("heLllo")));
    });
    it("notices when text is removed", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("hello"))
        });
        (0, _editorViewTestHelpersJs.findTextNode)(view.dom, "hello").nodeValue = "heo";
        flush(view);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("heo")));
    });
    it("handles ambiguous changes", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("hello"))
        });
        (0, _editorViewTestHelpersJs.findTextNode)(view.dom, "hello").nodeValue = "helo";
        flush(view);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("helo")));
    });
    it("respects stored marks", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("hello<a>"))
        });
        (0, _react.act)(()=>{
            view.dispatch(view.state.tr.addStoredMark(view.state.schema.marks.em.create()));
        });
        (0, _editorViewTestHelpersJs.findTextNode)(view.dom, "hello").nodeValue = "helloo";
        flush(view);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("hello", (0, _prosemirrorTestBuilder.em)("o"))));
    });
    it("can add a node", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("hello"))
        });
        const txt = (0, _editorViewTestHelpersJs.findTextNode)(view.dom, "hello");
        txt.parentNode.appendChild(document.createTextNode("!"));
        flush(view);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("hello!")));
    });
    it("can remove a text node", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("hello"))
        });
        const txt = (0, _editorViewTestHelpersJs.findTextNode)(view.dom, "hello");
        txt.parentNode.removeChild(txt);
        flush(view);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)()));
    });
    it("can add a paragraph", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("hello"))
        });
        view.dom.insertBefore(document.createElement("p"), view.dom.firstChild).appendChild(document.createTextNode("hey"));
        flush(view);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("hey"), (0, _prosemirrorTestBuilder.p)("hello")));
    });
    it("supports duplicating a paragraph", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("hello"))
        });
        view.dom.insertBefore(document.createElement("p"), view.dom.firstChild).appendChild(document.createTextNode("hello"));
        flush(view);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("hello"), (0, _prosemirrorTestBuilder.p)("hello")));
    });
    it("support inserting repeated text", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("hello"))
        });
        (0, _editorViewTestHelpersJs.findTextNode)(view.dom, "hello").nodeValue = "helhello";
        flush(view);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("helhello")));
    });
    it("detects an enter press", async ()=>{
        let enterPressed = false;
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.blockquote)((0, _prosemirrorTestBuilder.p)("foo"), (0, _prosemirrorTestBuilder.p)("<a>"))),
            handleKeyDown: (_, event)=>{
                if (event.key === "Enter") return enterPressed = true;
                return false;
            }
        });
        const bq = view.dom.querySelector("blockquote");
        bq.appendChild(document.createElement("p"));
        flush(view);
        (0, _globals.expect)(enterPressed).toBeTruthy();
    });
    it("detects a simple backspace press", async ()=>{
        let backspacePressed = false;
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.blockquote)((0, _prosemirrorTestBuilder.p)("foo"), (0, _prosemirrorTestBuilder.p)("<a>bar"))),
            handleKeyDown: (_, event)=>{
                if (event.key === "Backspace") return backspacePressed = true;
                return false;
            }
        });
        const user = _userEvent.default.setup();
        await (0, _react.act)(async ()=>{
            await user.type(view.dom.firstElementChild, "{Backspace}");
        });
        (0, _globals.expect)(backspacePressed).toBeTruthy();
    });
    // TODO: This causes React to throw an error, because we're
    // removing a DOM node that React was responsible for.
    // I'm not sure why this only fails in the test environment
    // (deletes work just fine in the browser).
    // eslint-disable-next-line jest/no-disabled-tests
    it.skip("doesn't route delete as backspace", ()=>{
        let backspacePressed = false;
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo<a>"), (0, _prosemirrorTestBuilder.p)("bar")),
            handleKeyDown: (_view, event)=>{
                if (event.key === "Backspace") return backspacePressed = true;
                return false;
            }
        });
        (0, _react.act)(()=>{
            view.dom.removeChild(view.dom.lastChild);
            view.dom.firstChild.textContent = "foobar";
            flush(view);
        });
        (0, _globals.expect)(backspacePressed).toBeFalsy();
    });
    it("correctly adjusts the selection", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("abc<a>"))
        });
        const textNode = (0, _editorViewTestHelpersJs.findTextNode)(view.dom, "abc");
        (0, _react.act)(()=>{
            textNode.nodeValue = "abcd";
            setSel(textNode, 3);
            flush(view);
        });
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("abcd")));
        (0, _globals.expect)(view.state.selection.anchor).toBe(4);
        (0, _globals.expect)(view.state.selection.head).toBe(4);
    });
    it("handles a deep split of nodes", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.blockquote)((0, _prosemirrorTestBuilder.p)("ab<a>cd")))
        });
        const quote = view.dom.querySelector("blockquote");
        const text1 = quote.firstChild.firstChild;
        const quote2 = view.dom.appendChild(quote.cloneNode(true));
        const text2 = quote2.firstChild.firstChild;
        text1.nodeValue = "abx";
        text2.nodeValue = "cd";
        setSel(text2.parentNode, 0);
        flush(view);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.blockquote)((0, _prosemirrorTestBuilder.p)("abx")), (0, _prosemirrorTestBuilder.blockquote)((0, _prosemirrorTestBuilder.p)("cd"))));
        (0, _globals.expect)(view.state.selection.anchor).toBe(9);
    });
    it("can delete the third instance of a character", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo xxx<a> bar"))
        });
        const textNode = (0, _editorViewTestHelpersJs.findTextNode)(view.dom, "foo xxx bar");
        textNode.nodeValue = "foo xx bar";
        flush(view);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo xx bar")));
    });
    it("can read a simple composition", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("hello<a>"))
        });
        const textNode = (0, _editorViewTestHelpersJs.findTextNode)(view.dom, "hello");
        textNode.nodeValue = "hellox";
        flush(view);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("hellox")));
    });
    it("can delete text in markup", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("a", (0, _prosemirrorTestBuilder.em)("b", img, (0, _prosemirrorTestBuilder.strong)("cd<a>")), "e"))
        });
        const textNode = (0, _editorViewTestHelpersJs.findTextNode)(view.dom, "cd");
        textNode.nodeValue = "c";
        flush(view);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("a", (0, _prosemirrorTestBuilder.em)("b", img, (0, _prosemirrorTestBuilder.strong)("c")), "e")));
    });
    it("recognizes typing inside markup", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("a", (0, _prosemirrorTestBuilder.em)("b", img, (0, _prosemirrorTestBuilder.strong)("cd<a>")), "e"))
        });
        const textNode = (0, _editorViewTestHelpersJs.findTextNode)(view.dom, "cd");
        textNode.nodeValue = "cdxy";
        flush(view);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("a", (0, _prosemirrorTestBuilder.em)("b", img, (0, _prosemirrorTestBuilder.strong)("cdxy")), "e")));
    });
    it("resolves ambiguous text input", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("fo<a>o"))
        });
        (0, _react.act)(()=>{
            view.dispatch(view.state.tr.addStoredMark(view.state.schema.marks.strong.create()));
        });
        const textNode = (0, _editorViewTestHelpersJs.findTextNode)(view.dom, "foo");
        textNode.nodeValue = "fooo";
        flush(view);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("fo", (0, _prosemirrorTestBuilder.strong)("o"), "o")));
    });
    it("does not repaint a text node when it's typed into", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("fo<a>o"))
        });
        const textNode = (0, _editorViewTestHelpersJs.findTextNode)(view.dom, "foo");
        textNode.nodeValue = "fojo";
        let mutated = false;
        const observer = new MutationObserver(()=>mutated = true);
        observer.observe(view.dom, {
            subtree: true,
            characterData: true,
            childList: true
        });
        flush(view);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("fojo")));
        (0, _globals.expect)(mutated).toBeFalsy();
        observer.disconnect();
    });
    it("understands text typed into an empty paragraph", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("<a>"))
        });
        const paragraph = view.dom.querySelector("p");
        paragraph.replaceChildren("i");
        flush(view);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("i")));
    });
    it("doesn't treat a placeholder BR as real content", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("i<a>"))
        });
        const paragraph = await _react.screen.findByText("i");
        paragraph.replaceChildren(document.createElement("br"));
        flush(view);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)()));
    });
    // TODO: Figure out why this doesn't work. Seems like React isn't
    // re-rendering after flushing a mutation that doesn't lead to a state
    // update.
    // eslint-disable-next-line jest/no-disabled-tests
    it.skip("fixes text changes when input is ignored", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo", (0, _prosemirrorTestBuilder.br)(), "bar")),
            dispatchTransaction () {
            // ignore transaction
            }
        });
        const paragraph = await _react.screen.findByText((text)=>text.startsWith("foo"));
        paragraph.replaceChild(document.createElement("img"), paragraph.lastChild);
        flush(view);
        (0, _globals.expect)(view.dom.textContent).toBe("foobar");
    });
    it("aborts when an incompatible state is set", ()=>{
        const { view , rerender  } = (0, _editorViewTestHelpersJs.tempEditor)({
            state: _prosemirrorState.EditorState.create({
                doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("<a>abcde"))
            })
        });
        const textNode = (0, _editorViewTestHelpersJs.findTextNode)(view.dom, "abcde");
        textNode.nodeValue = "xabcde";
        view.dispatchEvent({
            type: "input"
        });
        rerender({
            state: _prosemirrorState.EditorState.create({
                doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("uvw"))
            })
        });
        flush(view);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("uvw")));
    });
    // TODO: This causes React to throw an error, because we're
    // removing a DOM node that React was responsible for.
    // I'm not sure what would cause this actual behavior in real
    // life, but if we can replicate it, it would be good to get
    // it working.
    // eslint-disable-next-line jest/no-disabled-tests
    it.skip("recognizes a mark change as such", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("one")),
            dispatchTransaction (tr) {
                (0, _globals.expect)(tr.steps).toHaveLength(1);
                (0, _globals.expect)(tr.steps[0].toJSON().stepType).toBe("addMark");
                view.updateState(view.state.apply(tr));
            }
        });
        const paragraph = await _react.screen.findByText("one");
        const newChild = document.createElement("b");
        newChild.appendChild(document.createTextNode("one"));
        paragraph.replaceChildren(newChild);
        flush(view);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)((0, _prosemirrorTestBuilder.strong)("one"))));
    });
    it("preserves marks on deletion", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("one", (0, _prosemirrorTestBuilder.em)("x<a>")))
        });
        const emBlock = await _react.screen.findByText("x");
        emBlock.replaceChildren();
        view.dispatchEvent({
            type: "input"
        });
        (0, _react.act)(()=>{
            flush(view);
            view.dispatch(view.state.tr.insertText("y"));
        });
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("one", (0, _prosemirrorTestBuilder.em)("y"))));
    });
    it("works when a node's contentDOM is deleted", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("one"), (0, _prosemirrorTestBuilder.pre)("two<a>"))
        });
        const codeBlock = await _react.screen.findByText("two");
        (0, _react.act)(()=>{
            codeBlock.replaceChildren();
            view.dispatchEvent({
                type: "input"
            });
            flush(view);
        });
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("one"), (0, _prosemirrorTestBuilder.pre)()));
        (0, _globals.expect)(view.state.selection.head).toBe(6);
    });
    it("doesn't redraw content with marks when typing in front", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("f<a>oo", (0, _prosemirrorTestBuilder.em)("bar"), (0, _prosemirrorTestBuilder.strong)("baz")))
        });
        const bar = await _react.screen.findByText("bar");
        const foo = await _react.screen.findByText("foo");
        foo.firstChild.nodeValue = "froo";
        flush(view);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("froo", (0, _prosemirrorTestBuilder.em)("bar"), (0, _prosemirrorTestBuilder.strong)("baz"))));
        (0, _globals.expect)(bar).toBeTruthy();
        (0, _globals.expect)(view.dom.contains(bar)).toBeTruthy();
        (0, _globals.expect)(foo).toBeTruthy();
        (0, _globals.expect)(view.dom.contains(foo)).toBeTruthy();
    });
    it("doesn't redraw content with marks when typing inside mark", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo", (0, _prosemirrorTestBuilder.em)("b<a>ar"), (0, _prosemirrorTestBuilder.strong)("baz")))
        });
        const bar = await _react.screen.findByText("bar");
        const foo = await _react.screen.findByText("foo");
        bar.firstChild.nodeValue = "baar";
        flush(view);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo", (0, _prosemirrorTestBuilder.em)("baar"), (0, _prosemirrorTestBuilder.strong)("baz"))));
        (0, _globals.expect)(bar).toBeTruthy();
        (0, _globals.expect)(view.dom.contains(bar)).toBeTruthy();
        (0, _globals.expect)(foo).toBeTruthy();
        (0, _globals.expect)(view.dom.contains(foo)).toBeTruthy();
    });
    it("maps input to coordsAtPos through pending changes", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo"))
        });
        (0, _react.act)(()=>{
            view.dispatchEvent({
                type: "input"
            });
            view.dispatch(view.state.tr.insertText("more text"));
        });
        (0, _globals.expect)(view.coordsAtPos(13)).toBeTruthy();
    });
    it("notices text added to a cursor wrapper at the start of a mark", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)((0, _prosemirrorTestBuilder.strong)((0, _prosemirrorTestBuilder.a)("foo<a>"), "bar")))
        });
        const textNode = (0, _editorViewTestHelpersJs.findTextNode)(view.dom, "foo");
        textNode.nodeValue = "fooxy";
        flush(view);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)((0, _prosemirrorTestBuilder.strong)((0, _prosemirrorTestBuilder.a)("foo"), "xybar"))));
    });
    it("removes cursor wrapper text when the wrapper otherwise remains valid", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)((0, _prosemirrorTestBuilder.a)((0, _prosemirrorTestBuilder.strong)("foo<a>"), "bar")))
        });
        const textNode = (0, _editorViewTestHelpersJs.findTextNode)(view.dom, "foo");
        textNode.nodeValue = "fooq";
        flush(view);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)((0, _prosemirrorTestBuilder.a)((0, _prosemirrorTestBuilder.strong)("fooq"), "bar"))));
        const found = _react.screen.queryByText("\uFEFFq");
        (0, _globals.expect)(found).toBeNull();
    });
    it("doesn't confuse backspace with delete", async ()=>{
        let steps;
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("a<a>a")),
            dispatchTransaction (tr) {
                steps = tr.steps;
                view.updateState(view.state.apply(tr));
            }
        });
        view.input.lastKeyCode = 8;
        view.input.lastKeyCodeTime = Date.now();
        const textNode = (0, _editorViewTestHelpersJs.findTextNode)(view.dom, "aa");
        textNode.nodeValue = "a";
        flush(view);
        (0, _globals.expect)(steps).toHaveLength(1);
        (0, _globals.expect)(steps[0].from).toBe(1);
        (0, _globals.expect)(steps[0].to).toBe(2);
    });
    it("can disambiguate a multiple-character backspace event", async ()=>{
        let steps;
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo<a>foo")),
            dispatchTransaction (tr) {
                steps = tr.steps;
                view.updateState(view.state.apply(tr));
            }
        });
        view.input.lastKeyCode = 8;
        view.input.lastKeyCodeTime = Date.now();
        const textNode = (0, _editorViewTestHelpersJs.findTextNode)(view.dom, "foofoo");
        textNode.nodeValue = "foo";
        flush(view);
        (0, _globals.expect)(steps).toHaveLength(1);
        (0, _globals.expect)(steps[0].from).toBe(1);
        (0, _globals.expect)(steps[0].to).toBe(4);
    });
    it("doesn't confuse delete with backspace", async ()=>{
        let steps;
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("a<a>a")),
            dispatchTransaction (tr) {
                steps = tr.steps;
                view.updateState(view.state.apply(tr));
            }
        });
        const textNode = (0, _editorViewTestHelpersJs.findTextNode)(view.dom, "aa");
        textNode.nodeValue = "a";
        flush(view);
        (0, _globals.expect)(steps).toHaveLength(1);
        (0, _globals.expect)(steps[0].from).toBe(2);
        (0, _globals.expect)(steps[0].to).toBe(3);
    });
    it("doesn't confuse delete with backspace for multi-character deletions", async ()=>{
        let steps;
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("one foo<a>foo three")),
            dispatchTransaction (tr) {
                steps = tr.steps;
                view.updateState(view.state.apply(tr));
            }
        });
        const textNode = (0, _editorViewTestHelpersJs.findTextNode)(view.dom, "one foofoo three");
        textNode.nodeValue = "one foo three";
        flush(view);
        (0, _globals.expect)(steps).toHaveLength(1);
        (0, _globals.expect)(steps[0].from).toBe(8);
        (0, _globals.expect)(steps[0].to).toBe(11);
    });
    it("creates a correct step for an ambiguous selection-deletion", async ()=>{
        let steps;
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("la<a>la<b>la")),
            dispatchTransaction (tr) {
                steps = tr.steps;
                view.updateState(view.state.apply(tr));
            }
        });
        view.input.lastKeyCode = 8;
        view.input.lastKeyCodeTime = Date.now();
        const textNode = (0, _editorViewTestHelpersJs.findTextNode)(view.dom, "lalala");
        textNode.nodeValue = "lala";
        flush(view);
        (0, _globals.expect)(steps).toHaveLength(1);
        (0, _globals.expect)(steps[0].from).toBe(3);
        (0, _globals.expect)(steps[0].to).toBe(5);
    });
    it("creates a step that covers the entire selection for partially-matching replacement", async ()=>{
        let steps;
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("one <a>two<b> three")),
            dispatchTransaction (tr) {
                steps = tr.steps;
                view.updateState(view.state.apply(tr));
            }
        });
        const textNode = (0, _editorViewTestHelpersJs.findTextNode)(view.dom, "one two three");
        textNode.nodeValue = "one t three";
        flush(view);
        (0, _globals.expect)(steps).toHaveLength(1);
        (0, _globals.expect)(steps[0].from).toBe(5);
        (0, _globals.expect)(steps[0].to).toBe(8);
        (0, _globals.expect)(steps[0].slice.content.toString()).toBe('<"t">');
        (0, _react.act)(()=>{
            view.dispatch(view.state.tr.setSelection(_prosemirrorState.TextSelection.create(view.state.doc, 7, 12)));
        });
        textNode.nodeValue = "one t e";
        flush(view);
        (0, _globals.expect)(steps).toHaveLength(1);
        (0, _globals.expect)(steps[0].from).toBe(7);
        (0, _globals.expect)(steps[0].to).toBe(12);
        (0, _globals.expect)(steps[0].slice.content.toString()).toBe('<"e">');
    });
});
