/* eslint-disable @typescript-eslint/no-explicit-any */ /* eslint-disable @typescript-eslint/no-non-null-assertion */ import { screen } from "@testing-library/react";
import { EditorState, TextSelection } from "prosemirror-state";
import { a, blockquote, doc, em, p, pre, strong } from "prosemirror-test-builder";
import { Key } from "webdriverio";
import { tempEditor } from "../../testing/editorViewTestHelpers.js";
describe("DOM change", ()=>{
    it("notices when text is added", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("he<a>llo"))
        });
        view.focus();
        await browser.keys([
            Key.Shift,
            "l"
        ]);
        expect(view.state.doc).toEqualNode(doc(p("heLllo")));
    });
    it("notices when text is removed", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("hell<a>o"))
        });
        view.focus();
        await browser.keys(Key.Backspace);
        await browser.keys(Key.Backspace);
        expect(view.state.doc).toEqualNode(doc(p("heo")));
    });
    it("respects stored marks", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("hello<a>"))
        });
        view.dispatch(view.state.tr.addStoredMark(view.state.schema.marks.em.create()));
        view.focus();
        await browser.keys("o");
        expect(view.state.doc).toEqualNode(doc(p("hello", em("o"))));
    });
    it("support inserting repeated text", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("hello"))
        });
        view.focus();
        await browser.keys("h");
        await browser.keys("e");
        await browser.keys("l");
        expect(view.state.doc).toEqualNode(doc(p("helhello")));
    });
    it("detects an enter press", async ()=>{
        let enterPressed = false;
        const { view  } = tempEditor({
            doc: doc(blockquote(p("foo"), p("<a>"))),
            handleKeyDown: (_, event)=>{
                if (event.key === "Enter") return enterPressed = true;
                return false;
            }
        });
        view.focus();
        await browser.keys(Key.Enter);
        expect(enterPressed).toBeTruthy();
    });
    it("detects a simple backspace press", async ()=>{
        let backspacePressed = false;
        const { view  } = tempEditor({
            doc: doc(blockquote(p("foo"), p("<a>"))),
            handleKeyDown: (_, event)=>{
                if (event.key === "Backspace") return backspacePressed = true;
                return false;
            }
        });
        view.focus();
        await browser.keys(Key.Backspace);
        expect(backspacePressed).toBeTruthy();
    });
    it("correctly adjusts the selection", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("abc<a>"))
        });
        view.focus();
        await browser.keys("d");
        expect(view.state.doc).toEqualNode(doc(p("abcd")));
        expect(view.state.selection.anchor).toBe(5);
        expect(view.state.selection.head).toBe(5);
    });
    // todoit("can read a simple composition", () => {
    //   let view = tempEditor({ doc: doc(p("hello")) });
    //   findTextNode(view.dom, "hello")!.nodeValue = "hellox";
    //   flush(view);
    //   ist(view.state.doc, doc(p("hellox")), eq);
    // });
    // $$FORK: We _do_ repaint text nodes when they're typed into.
    // Unlike prosemirror-view, we prevent user inputs from modifying
    // the dom until after we've turned them into transactions.
    // This test instead ensures that we only modify the character data,
    // rather than replacing entire nodes.
    it("does not replace a text node when it's typed into", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("fo<a>o"))
        });
        let mutated = false;
        const observer = new MutationObserver(()=>mutated = true);
        observer.observe(view.dom, {
            subtree: true,
            characterData: false,
            childList: true
        });
        view.focus();
        await browser.keys("j");
        expect(view.state.doc).toEqualNode(doc(p("fojo")));
        expect(mutated).toBeFalsy();
        observer.disconnect();
    });
    it("understands text typed into an empty paragraph", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("<a>"))
        });
        view.focus();
        await browser.keys("i");
        expect(view.state.doc).toEqualNode(doc(p("i")));
    });
    it("fixes text changes when input is ignored", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foo<a>")),
            controlled: true,
            dispatchTransaction () {
            // intentionally do nothing
            }
        });
        view.focus();
        await browser.keys("i");
        expect(view.dom.textContent).toBe("foo");
    });
    it("aborts when an incompatible state is set", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("<a>abcde"))
        });
        view.dispatchEvent({
            type: "input"
        });
        view.focus();
        await browser.keys("x");
        view.updateState(EditorState.create({
            doc: doc(p("uvw"))
        }));
        expect(view.state.doc).toEqualNode(doc(p("uvw")));
    });
    it("preserves marks on deletion", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("one", em("x<a>")))
        });
        view.focus();
        await browser.keys(Key.Backspace);
        view.dispatchEvent({
            type: "input"
        });
        view.dispatch(view.state.tr.insertText("y"));
        expect(view.state.doc).toEqualNode(doc(p("one", em("y"))));
    });
    it("works when a node's contentDOM is deleted", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("one"), pre("two<a>"))
        });
        view.focus();
        await browser.keys(Key.Backspace);
        await browser.keys(Key.Backspace);
        await browser.keys(Key.Backspace);
        view.dispatchEvent({
            type: "input"
        });
        expect(view.state.doc).toEqualNode(doc(p("one"), pre()));
        expect(view.state.selection.head).toBe(6);
    });
    it("doesn't redraw content with marks when typing in front", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("f<a>oo", em("bar"), strong("baz")))
        });
        const bar = await screen.findByText("bar");
        const foo = await screen.findByText("foo");
        view.focus();
        await browser.keys("r");
        expect(view.state.doc).toEqualNode(doc(p("froo", em("bar"), strong("baz"))));
        expect(bar.parentNode).toBeTruthy();
        expect(view.dom.contains(bar.parentNode)).toBeTruthy();
        expect(foo.parentNode).toBeTruthy();
        expect(view.dom.contains(foo.parentNode)).toBeTruthy();
    });
    it("doesn't redraw content with marks when typing inside mark", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foo", em("b<a>ar"), strong("baz")))
        });
        const bar = await screen.findByText("bar");
        const foo = await screen.findByText("foo");
        view.focus();
        await browser.keys("a");
        expect(view.state.doc).toEqualNode(doc(p("foo", em("baar"), strong("baz"))));
        expect(bar.parentNode).toBeTruthy();
        expect(view.dom.contains(bar.parentNode)).toBeTruthy();
        expect(foo.parentNode).toBeTruthy();
        expect(view.dom.contains(foo.parentNode)).toBeTruthy();
    });
    it("maps input to coordsAtPos through pending changes", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foo"))
        });
        view.dispatchEvent({
            type: "input"
        });
        view.dispatch(view.state.tr.insertText("more text"));
        expect(view.coordsAtPos(13)).toBeTruthy();
    });
    it("notices text added to a cursor wrapper at the start of a mark", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p(strong(a("foo<a>"), "bar")))
        });
        view.focus();
        await browser.keys("xy");
        expect(view.state.doc).toEqualNode(doc(p(strong(a("foo"), "xybar"))));
    });
    it("removes cursor wrapper text when the wrapper otherwise remains valid", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p(a(strong("foo<a>"), "bar")))
        });
        view.focus();
        await browser.keys("q");
        expect(view.state.doc).toEqualNode(doc(p(a(strong("fooq"), "bar"))));
        const found = screen.queryByText("\uFEFFq");
        expect(found).toBeNull();
    });
    it("creates a correct step for an ambiguous selection-deletion", async ()=>{
        let steps;
        const { view  } = tempEditor({
            doc: doc(p("la<a>la<b>la")),
            dispatchTransaction (tr) {
                steps = tr.steps;
                view.updateState(view.state.apply(tr));
            }
        });
        view.input.lastKeyCode = 8;
        view.input.lastKeyCodeTime = Date.now();
        view.focus();
        await browser.keys(Key.Backspace);
        expect(steps).toHaveLength(1);
        expect(steps[0].from).toBe(3);
        expect(steps[0].to).toBe(5);
    });
    it("creates a step that covers the entire selection for partially-matching replacement", async ()=>{
        let steps;
        const { view  } = tempEditor({
            doc: doc(p("one <a>two<b> three")),
            dispatchTransaction (tr) {
                steps = tr.steps;
                view.updateState(view.state.apply(tr));
            }
        });
        view.focus();
        await browser.keys("t");
        expect(steps).toHaveLength(1);
        expect(steps[0].from).toBe(5);
        expect(steps[0].to).toBe(8);
        expect(steps[0].slice.content.toString()).toBe('<"t">');
        view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 7, 12)));
        view.focus();
        await browser.keys("e");
        expect(steps).toHaveLength(1);
        expect(steps[0].from).toBe(7);
        expect(steps[0].to).toBe(12);
        expect(steps[0].slice.content.toString()).toBe('<"e">');
    });
});
