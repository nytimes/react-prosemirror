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
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect } from "@jest/globals";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditorState, TextSelection } from "prosemirror-state";
import {
  a,
  blockquote,
  br,
  doc,
  em,
  img as img_,
  p,
  pre,
  strong,
} from "prosemirror-test-builder";
import { Step } from "prosemirror-transform";

import { EditorView } from "../../prosemirror-view/index.js";
import {
  findTextNode,
  tempEditor,
} from "../../testing/editorViewTestHelpers.js";
import { setupProseMirrorView } from "../../testing/setupProseMirrorView.js";

const img = img_({
  src: "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
});

function flush(view: EditorView) {
  act(() => {
    view.domObserver.flush();
  });
}

function setSel(aNode: Node, aOff: number, fNode?: Node, fOff = 0) {
  const r = document.createRange();
  const s = window.getSelection()!;
  r.setEnd(fNode || aNode, fNode ? fOff : aOff);
  r.setStart(aNode, aOff);
  s.removeAllRanges();
  s.addRange(r);
}

describe("DOM change", () => {
  beforeAll(() => {
    setupProseMirrorView();
  });

  it("notices when text is added", () => {
    const { view } = tempEditor({ doc: doc(p("hello")) });
    findTextNode(view.dom, "hello")!.nodeValue = "heLllo";
    flush(view);
    expect(view.state.doc).toEqualNode(doc(p("heLllo")));
  });

  it("notices when text is removed", () => {
    const { view } = tempEditor({ doc: doc(p("hello")) });
    findTextNode(view.dom, "hello")!.nodeValue = "heo";
    flush(view);
    expect(view.state.doc).toEqualNode(doc(p("heo")));
  });

  it("handles ambiguous changes", () => {
    const { view } = tempEditor({ doc: doc(p("hello")) });
    findTextNode(view.dom, "hello")!.nodeValue = "helo";
    flush(view);
    expect(view.state.doc).toEqualNode(doc(p("helo")));
  });

  it("respects stored marks", async () => {
    const { view } = tempEditor({ doc: doc(p("hello<a>")) });
    act(() => {
      view.dispatch(
        view.state.tr.addStoredMark(view.state.schema.marks.em!.create())
      );
    });

    findTextNode(view.dom, "hello")!.nodeValue = "helloo";
    flush(view);

    expect(view.state.doc).toEqualNode(doc(p("hello", em("o"))));
  });

  it("can add a node", () => {
    const { view } = tempEditor({ doc: doc(p("hello")) });
    const txt = findTextNode(view.dom, "hello");
    txt.parentNode!.appendChild(document.createTextNode("!"));
    flush(view);
    expect(view.state.doc).toEqualNode(doc(p("hello!")));
  });

  it("can remove a text node", () => {
    const { view } = tempEditor({ doc: doc(p("hello")) });
    const txt = findTextNode(view.dom, "hello");
    txt.parentNode!.removeChild(txt);
    flush(view);
    expect(view.state.doc).toEqualNode(doc(p()));
  });

  it("can add a paragraph", () => {
    const { view } = tempEditor({ doc: doc(p("hello")) });
    view.dom
      .insertBefore(document.createElement("p"), view.dom.firstChild)
      .appendChild(document.createTextNode("hey"));
    flush(view);
    expect(view.state.doc).toEqualNode(doc(p("hey"), p("hello")));
  });

  it("supports duplicating a paragraph", () => {
    const { view } = tempEditor({ doc: doc(p("hello")) });
    view.dom
      .insertBefore(document.createElement("p"), view.dom.firstChild)
      .appendChild(document.createTextNode("hello"));
    flush(view);
    expect(view.state.doc).toEqualNode(doc(p("hello"), p("hello")));
  });

  it("support inserting repeated text", async () => {
    const { view } = tempEditor({ doc: doc(p("hello")) });

    findTextNode(view.dom, "hello").nodeValue = "helhello";
    flush(view);

    expect(view.state.doc).toEqualNode(doc(p("helhello")));
  });

  it("detects an enter press", async () => {
    let enterPressed = false;
    const { view } = tempEditor({
      doc: doc(blockquote(p("foo"), p("<a>"))),
      handleKeyDown: (_, event) => {
        if (event.key === "Enter") return (enterPressed = true);
        return false;
      },
    });

    const bq = view.dom.querySelector("blockquote")!;
    bq.appendChild(document.createElement("p"));
    flush(view);

    expect(enterPressed).toBeTruthy();
  });

  it("detects a simple backspace press", async () => {
    let backspacePressed = false;

    const { view } = tempEditor({
      doc: doc(blockquote(p("foo"), p("<a>bar"))),
      handleKeyDown: (_, event) => {
        if (event.key === "Backspace") return (backspacePressed = true);
        return false;
      },
    });

    const user = userEvent.setup();
    await act(async () => {
      await user.type(view.dom.firstElementChild!, "{Backspace}");
    });

    expect(backspacePressed).toBeTruthy();
  });

  // TODO: This causes React to throw an error, because we're
  // removing a DOM node that React was responsible for.
  // I'm not sure why this only fails in the test environment
  // (deletes work just fine in the browser).
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip("doesn't route delete as backspace", () => {
    let backspacePressed = false;
    const { view } = tempEditor({
      doc: doc(p("foo<a>"), p("bar")),
      handleKeyDown: (_view, event) => {
        if (event.key === "Backspace") return (backspacePressed = true);
        return false;
      },
    });
    act(() => {
      view.dom.removeChild(view.dom.lastChild!);
      view.dom.firstChild!.textContent = "foobar";
      flush(view);
    });
    expect(backspacePressed).toBeFalsy();
  });

  it("correctly adjusts the selection", () => {
    const { view } = tempEditor({ doc: doc(p("abc<a>")) });
    const textNode = findTextNode(view.dom, "abc");
    act(() => {
      textNode.nodeValue = "abcd";
      setSel(textNode, 3);
      flush(view);
    });
    expect(view.state.doc).toEqualNode(doc(p("abcd")));
    expect(view.state.selection.anchor).toBe(4);
    expect(view.state.selection.head).toBe(4);
  });

  it("handles a deep split of nodes", () => {
    const { view } = tempEditor({ doc: doc(blockquote(p("ab<a>cd"))) });

    const quote = view.dom.querySelector("blockquote")!;
    const text1 = quote.firstChild!.firstChild!;
    const quote2 = view.dom.appendChild(quote.cloneNode(true) as HTMLElement);
    const text2 = quote2.firstChild!.firstChild!;
    text1.nodeValue = "abx";
    text2.nodeValue = "cd";

    setSel(text2.parentNode!, 0);

    flush(view);

    expect(view.state.doc).toEqualNode(
      doc(blockquote(p("abx")), blockquote(p("cd")))
    );
    expect(view.state.selection.anchor).toBe(9);
  });

  it("can delete the third instance of a character", () => {
    const { view } = tempEditor({ doc: doc(p("foo xxx<a> bar")) });
    const textNode = findTextNode(view.dom, "foo xxx bar");
    textNode.nodeValue = "foo xx bar";
    flush(view);
    expect(view.state.doc).toEqualNode(doc(p("foo xx bar")));
  });

  it("can read a simple composition", () => {
    const { view } = tempEditor({ doc: doc(p("hello<a>")) });
    const textNode = findTextNode(view.dom, "hello");

    textNode.nodeValue = "hellox";
    flush(view);
    expect(view.state.doc).toEqualNode(doc(p("hellox")));
  });

  it("can delete text in markup", () => {
    const { view } = tempEditor({
      doc: doc(p("a", em("b", img, strong("cd<a>")), "e")),
    });
    const textNode = findTextNode(view.dom, "cd");
    textNode.nodeValue = "c";
    flush(view);
    expect(view.state.doc).toEqualNode(
      doc(p("a", em("b", img, strong("c")), "e"))
    );
  });

  it("recognizes typing inside markup", () => {
    const { view } = tempEditor({
      doc: doc(p("a", em("b", img, strong("cd<a>")), "e")),
    });
    const textNode = findTextNode(view.dom, "cd");
    textNode.nodeValue = "cdxy";
    flush(view);
    expect(view.state.doc).toEqualNode(
      doc(p("a", em("b", img, strong("cdxy")), "e"))
    );
  });

  it("resolves ambiguous text input", () => {
    const { view } = tempEditor({ doc: doc(p("fo<a>o")) });
    act(() => {
      view.dispatch(
        view.state.tr.addStoredMark(view.state.schema.marks.strong!.create())
      );
    });
    const textNode = findTextNode(view.dom, "foo")!;
    textNode.nodeValue = "fooo";
    flush(view);
    expect(view.state.doc).toEqualNode(doc(p("fo", strong("o"), "o")));
  });

  it("does not repaint a text node when it's typed into", () => {
    const { view } = tempEditor({ doc: doc(p("fo<a>o")) });
    const textNode = findTextNode(view.dom, "foo");
    textNode.nodeValue = "fojo";
    let mutated = false;
    const observer = new MutationObserver(() => (mutated = true));
    observer.observe(view.dom, {
      subtree: true,
      characterData: true,
      childList: true,
    });
    flush(view);
    expect(view.state.doc).toEqualNode(doc(p("fojo")));
    expect(mutated).toBeFalsy();
    observer.disconnect();
  });

  it("understands text typed into an empty paragraph", () => {
    const { view } = tempEditor({ doc: doc(p("<a>")) });
    const paragraph = view.dom.querySelector("p")!;
    paragraph.replaceChildren("i");
    flush(view);

    expect(view.state.doc).toEqualNode(doc(p("i")));
  });

  it("doesn't treat a placeholder BR as real content", async () => {
    const { view } = tempEditor({ doc: doc(p("i<a>")) });

    const paragraph = await screen.findByText("i");
    paragraph.replaceChildren(document.createElement("br"));
    flush(view);

    expect(view.state.doc).toEqualNode(doc(p()));
  });

  // TODO: Figure out why this doesn't work. Seems like React isn't
  // re-rendering after flushing a mutation that doesn't lead to a state
  // update.
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip("fixes text changes when input is ignored", async () => {
    const { view } = tempEditor({
      doc: doc(p("foo", br(), "bar")),
      dispatchTransaction() {
        // ignore transaction
      },
    });
    const paragraph = await screen.findByText((text) => text.startsWith("foo"));
    paragraph.replaceChild(document.createElement("img"), paragraph.lastChild!);
    flush(view);

    expect(view.dom.textContent).toBe("foobar");
  });

  it("aborts when an incompatible state is set", () => {
    const { view, rerender } = tempEditor({
      state: EditorState.create({ doc: doc(p("<a>abcde")) }),
    });

    const textNode = findTextNode(view.dom, "abcde");

    textNode.nodeValue = "xabcde";
    view.dispatchEvent({ type: "input" } as Event);
    rerender({ state: EditorState.create({ doc: doc(p("uvw")) }) });

    flush(view);

    expect(view.state.doc).toEqualNode(doc(p("uvw")));
  });

  // TODO: This causes React to throw an error, because we're
  // removing a DOM node that React was responsible for.
  // I'm not sure what would cause this actual behavior in real
  // life, but if we can replicate it, it would be good to get
  // it working.
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip("recognizes a mark change as such", async () => {
    const { view } = tempEditor({
      doc: doc(p("one")),
      dispatchTransaction(tr) {
        expect(tr.steps).toHaveLength(1);
        expect(tr.steps[0]!.toJSON().stepType).toBe("addMark");
        view.updateState(view.state.apply(tr));
      },
    });

    const paragraph = await screen.findByText("one");
    const newChild = document.createElement("b");
    newChild.appendChild(document.createTextNode("one"));
    paragraph.replaceChildren(newChild);
    flush(view);
    expect(view.state.doc).toEqualNode(doc(p(strong("one"))));
  });

  it("preserves marks on deletion", async () => {
    const { view } = tempEditor({ doc: doc(p("one", em("x<a>"))) });

    const emBlock = await screen.findByText("x");

    emBlock.replaceChildren();
    view.dispatchEvent({ type: "input" } as Event);
    act(() => {
      flush(view);
      view.dispatch(view.state.tr.insertText("y"));
    });

    expect(view.state.doc).toEqualNode(doc(p("one", em("y"))));
  });

  it("works when a node's contentDOM is deleted", async () => {
    const { view } = tempEditor({ doc: doc(p("one"), pre("two<a>")) });
    const codeBlock = await screen.findByText("two");
    act(() => {
      codeBlock.replaceChildren();
      view.dispatchEvent({ type: "input" } as Event);
      flush(view);
    });
    expect(view.state.doc).toEqualNode(doc(p("one"), pre()));
    expect(view.state.selection.head).toBe(6);
  });

  it("doesn't redraw content with marks when typing in front", async () => {
    const { view } = tempEditor({
      doc: doc(p("f<a>oo", em("bar"), strong("baz"))),
    });
    const bar = await screen.findByText("bar");
    const foo = await screen.findByText("foo");
    foo.firstChild!.nodeValue = "froo";
    flush(view);
    expect(view.state.doc).toEqualNode(
      doc(p("froo", em("bar"), strong("baz")))
    );
    expect(bar).toBeTruthy();
    expect(view.dom.contains(bar)).toBeTruthy();
    expect(foo).toBeTruthy();
    expect(view.dom.contains(foo)).toBeTruthy();
  });

  it("doesn't redraw content with marks when typing inside mark", async () => {
    const { view } = tempEditor({
      doc: doc(p("foo", em("b<a>ar"), strong("baz"))),
    });
    const bar = await screen.findByText("bar");
    const foo = await screen.findByText("foo");
    bar.firstChild!.nodeValue = "baar";
    flush(view);
    expect(view.state.doc).toEqualNode(
      doc(p("foo", em("baar"), strong("baz")))
    );
    expect(bar).toBeTruthy();
    expect(view.dom.contains(bar)).toBeTruthy();
    expect(foo).toBeTruthy();
    expect(view.dom.contains(foo)).toBeTruthy();
  });

  it("maps input to coordsAtPos through pending changes", () => {
    const { view } = tempEditor({ doc: doc(p("foo")) });
    act(() => {
      view.dispatchEvent({ type: "input" } as Event);
      view.dispatch(view.state.tr.insertText("more text"));
    });
    expect(view.coordsAtPos(13)).toBeTruthy();
  });

  it("notices text added to a cursor wrapper at the start of a mark", async () => {
    const { view } = tempEditor({ doc: doc(p(strong(a("foo<a>"), "bar"))) });
    const textNode = findTextNode(view.dom, "foo");
    textNode.nodeValue = "fooxy";
    flush(view);

    expect(view.state.doc).toEqualNode(doc(p(strong(a("foo"), "xybar"))));
  });

  it("removes cursor wrapper text when the wrapper otherwise remains valid", async () => {
    const { view } = tempEditor({ doc: doc(p(a(strong("foo<a>"), "bar"))) });

    const textNode = findTextNode(view.dom, "foo");
    textNode.nodeValue = "fooq";
    flush(view);

    expect(view.state.doc).toEqualNode(doc(p(a(strong("fooq"), "bar"))));
    const found = screen.queryByText("\ufeffq");
    expect(found).toBeNull();
  });

  it("doesn't confuse backspace with delete", async () => {
    let steps: Step[];
    const { view } = tempEditor({
      doc: doc(p("a<a>a")),
      dispatchTransaction(tr) {
        steps = tr.steps;
        view.updateState(view.state.apply(tr));
      },
    });

    view.input.lastKeyCode = 8;
    view.input.lastKeyCodeTime = Date.now();
    const textNode = findTextNode(view.dom, "aa");
    textNode.nodeValue = "a";
    flush(view);

    expect(steps!).toHaveLength(1);
    expect((steps![0] as any).from).toBe(1);
    expect((steps![0] as any).to).toBe(2);
  });

  it("can disambiguate a multiple-character backspace event", async () => {
    let steps: Step[];
    const { view } = tempEditor({
      doc: doc(p("foo<a>foo")),
      dispatchTransaction(tr) {
        steps = tr.steps;
        view.updateState(view.state.apply(tr));
      },
    });

    view.input.lastKeyCode = 8;
    view.input.lastKeyCodeTime = Date.now();

    const textNode = findTextNode(view.dom, "foofoo");
    textNode.nodeValue = "foo";
    flush(view);

    expect(steps!).toHaveLength(1);
    expect((steps![0] as any).from).toBe(1);
    expect((steps![0] as any).to).toBe(4);
  });

  it("doesn't confuse delete with backspace", async () => {
    let steps: Step[];
    const { view } = tempEditor({
      doc: doc(p("a<a>a")),
      dispatchTransaction(tr) {
        steps = tr.steps;
        view.updateState(view.state.apply(tr));
      },
    });

    const textNode = findTextNode(view.dom, "aa");
    textNode.nodeValue = "a";
    flush(view);

    expect(steps!).toHaveLength(1);
    expect((steps![0] as any).from).toBe(2);
    expect((steps![0] as any).to).toBe(3);
  });

  it("doesn't confuse delete with backspace for multi-character deletions", async () => {
    let steps: Step[];
    const { view } = tempEditor({
      doc: doc(p("one foo<a>foo three")),
      dispatchTransaction(tr) {
        steps = tr.steps;
        view.updateState(view.state.apply(tr));
      },
    });

    const textNode = findTextNode(view.dom, "one foofoo three");
    textNode.nodeValue = "one foo three";
    flush(view);

    expect(steps!).toHaveLength(1);
    expect((steps![0] as any).from).toBe(8);
    expect((steps![0] as any).to).toBe(11);
  });

  it("creates a correct step for an ambiguous selection-deletion", async () => {
    let steps: Step[];
    const { view } = tempEditor({
      doc: doc(p("la<a>la<b>la")),
      dispatchTransaction(tr) {
        steps = tr.steps;
        view.updateState(view.state.apply(tr));
      },
    });

    view.input.lastKeyCode = 8;
    view.input.lastKeyCodeTime = Date.now();
    const textNode = findTextNode(view.dom, "lalala");
    textNode.nodeValue = "lala";
    flush(view);

    expect(steps!).toHaveLength(1);
    expect((steps![0] as any).from).toBe(3);
    expect((steps![0] as any).to).toBe(5);
  });

  it("creates a step that covers the entire selection for partially-matching replacement", async () => {
    let steps: Step[];
    const { view } = tempEditor({
      doc: doc(p("one <a>two<b> three")),
      dispatchTransaction(tr) {
        steps = tr.steps;
        view.updateState(view.state.apply(tr));
      },
    });

    const textNode = findTextNode(view.dom, "one two three");
    textNode.nodeValue = "one t three";
    flush(view);
    expect(steps!).toHaveLength(1);
    expect((steps![0] as any).from).toBe(5);
    expect((steps![0] as any).to).toBe(8);
    expect((steps![0] as any).slice.content.toString()).toBe('<"t">');

    act(() => {
      view.dispatch(
        view.state.tr.setSelection(TextSelection.create(view.state.doc, 7, 12))
      );
    });

    textNode.nodeValue = "one t e";

    flush(view);

    expect(steps!).toHaveLength(1);
    expect((steps![0] as any).from).toBe(7);
    expect((steps![0] as any).to).toBe(12);
    expect((steps![0] as any).slice.content.toString()).toBe('<"e">');
  });
});
