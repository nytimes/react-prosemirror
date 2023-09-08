/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect } from "@jest/globals";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditorState, TextSelection } from "prosemirror-state";
import {
  a,
  blockquote,
  doc,
  em,
  p,
  pre,
  strong,
} from "prosemirror-test-builder";
import { Step } from "prosemirror-transform";

import { tempEditor } from "../../testing/editorViewTestHelpers.js";
import { setupProseMirrorView } from "../../testing/setupProseMirrorView.js";

describe("DOM change", () => {
  beforeAll(() => {
    setupProseMirrorView();
  });

  it("notices when text is added", async () => {
    const { view } = tempEditor({ doc: doc(p("he<a>llo")) });
    const user = userEvent.setup();

    await act(async () => {
      await user.type(view.dom, "L");
    });

    expect(view.state.doc).toEqualNode(doc(p("heLllo")));
  });

  it("notices when text is removed", async () => {
    const { view } = tempEditor({ doc: doc(p("hell<a>o")) });
    const user = userEvent.setup();

    await act(async () => {
      await user.type(view.dom, "[Backspace>2/]");
    });

    expect(view.state.doc).toEqualNode(doc(p("heo")));
  });

  it("respects stored marks", async () => {
    const { view } = tempEditor({ doc: doc(p("hello<a>")) });
    const user = userEvent.setup();
    await act(async () => {
      view.dispatch(
        view.state.tr.addStoredMark(view.state.schema.marks.em!.create())
      );
      await user.type(view.dom, "o");
    });

    expect(view.state.doc).toEqualNode(doc(p("hello", em("o"))));
  });

  it("support inserting repeated text", async () => {
    const { view } = tempEditor({ doc: doc(p("hello")) });
    const user = userEvent.setup();
    await act(async () => {
      await user.type(view.dom, "hel");
    });

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

    const user = userEvent.setup();
    await act(async () => {
      await user.type(view.dom, "{Enter}");
    });

    expect(enterPressed).toBeTruthy();
  });

  it("detects a simple backspace press", async () => {
    let backspacePressed = false;

    const { view } = tempEditor({
      doc: doc(blockquote(p("foo"), p("<a>"))),
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

  it("correctly adjusts the selection", async () => {
    const user = userEvent.setup();
    const { view } = tempEditor({ doc: doc(p("abc<a>")) });
    await act(async () => {
      await user.type(view.dom, "d");
    });

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
  it("does not replace a text node when it's typed into", async () => {
    const { view } = tempEditor({
      doc: doc(p("fo<a>o")),
    });

    let mutated = false;
    const observer = new MutationObserver(() => (mutated = true));
    observer.observe(view.dom, {
      subtree: true,
      characterData: false,
      childList: true,
    });

    const user = userEvent.setup();
    await act(async () => {
      await user.type(view.dom, "j");
    });

    expect(view.state.doc).toEqualNode(doc(p("fojo")));
    expect(mutated).toBeFalsy();
    observer.disconnect();
  });

  it("understands text typed into an empty paragraph", async () => {
    const user = userEvent.setup();
    const { view } = tempEditor({ doc: doc(p("<a>")) });
    await act(async () => {
      await user.type(view.dom, "i");
    });

    expect(view.state.doc).toEqualNode(doc(p("i")));
  });

  it("fixes text changes when input is ignored", async () => {
    const { view } = tempEditor({
      doc: doc(p("foo<a>")),
      dispatchTransaction: () => undefined,
    });
    const user = userEvent.setup();
    await act(async () => {
      await user.type(view.dom, "i");
    });
    expect(view.dom.textContent).toBe("foo");
  });

  it("aborts when an incompatible state is set", async () => {
    const { view } = tempEditor({ doc: doc(p("<a>abcde")) });

    const user = userEvent.setup();
    await act(async () => {
      view.dispatchEvent({ type: "input" } as Event);
      await user.type(view.dom, "x");
    });

    view.updateState(EditorState.create({ doc: doc(p("uvw")) }));
    expect(view.state.doc).toEqualNode(doc(p("uvw")));
  });

  it("preserves marks on deletion", async () => {
    const { view } = tempEditor({ doc: doc(p("one", em("x<a>"))) });

    const user = userEvent.setup();

    await act(async () => {
      await user.type(view.dom, "[Backspace]");
      view.dispatchEvent({ type: "input" } as Event);
      view.dispatch(view.state.tr.insertText("y"));
    });

    expect(view.state.doc).toEqualNode(doc(p("one", em("y"))));
  });

  it("works when a node's contentDOM is deleted", async () => {
    const { view } = tempEditor({ doc: doc(p("one"), pre("two<a>")) });
    const user = userEvent.setup();
    await act(async () => {
      await user.type(view.dom, "[Backspace>3/]");
      view.dispatchEvent({ type: "input" } as Event);
    });
    expect(view.state.doc).toEqualNode(doc(p("one"), pre()));
    expect(view.state.selection.head).toBe(6);
  });

  // TODO: Do we want to fix this? This is happening because we
  // use the node position as the React key,
  it("doesn't redraw content with marks when typing in front", async () => {
    const { view } = tempEditor({
      doc: doc(p("f<a>oo", em("bar"), strong("baz"))),
    });
    const bar = await screen.findByText("bar");
    const foo = await screen.findByText("foo");
    const user = userEvent.setup();
    await act(async () => {
      await user.type(view.dom, "r");
    });
    expect(view.state.doc).toEqualNode(
      doc(p("froo", em("bar"), strong("baz")))
    );
    expect(bar.parentNode).toBeTruthy();
    expect(view.dom.contains(bar.parentNode)).toBeTruthy();
    expect(foo.parentNode).toBeTruthy();
    expect(view.dom.contains(foo.parentNode)).toBeTruthy();
  });

  it("doesn't redraw content with marks when typing inside mark", async () => {
    const { view } = tempEditor({
      doc: doc(p("foo", em("b<a>ar"), strong("baz"))),
    });
    const bar = await screen.findByText("bar");
    const foo = await screen.findByText("foo");
    const user = userEvent.setup();
    await act(async () => {
      await user.type(view.dom, "a");
    });
    expect(view.state.doc).toEqualNode(
      doc(p("foo", em("baar"), strong("baz")))
    );
    expect(bar.parentNode).toBeTruthy();
    expect(view.dom.contains(bar.parentNode)).toBeTruthy();
    expect(foo.parentNode).toBeTruthy();
    expect(view.dom.contains(foo.parentNode)).toBeTruthy();
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
    const user = userEvent.setup();
    await act(async () => {
      await user.type(view.dom, "xy");
    });

    expect(view.state.doc).toEqualNode(doc(p(strong(a("foo"), "xybar"))));
  });

  it("removes cursor wrapper text when the wrapper otherwise remains valid", async () => {
    const { view } = tempEditor({ doc: doc(p(a(strong("foo<a>"), "bar"))) });
    const user = userEvent.setup();
    await act(async () => {
      await user.type(view.dom, "q");
    });
    expect(view.state.doc).toEqualNode(doc(p(a(strong("fooq"), "bar"))));
    const found = screen.queryByText("\ufeffq");
    expect(found).toBeNull();
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
    const user = userEvent.setup();
    await act(async () => {
      await user.type(view.dom, "[Backspace]");
    });

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

    const user = userEvent.setup();
    await act(async () => {
      await user.type(view.dom, "t");
    });
    expect(steps!).toHaveLength(1);
    expect((steps![0] as any).from).toBe(5);
    expect((steps![0] as any).to).toBe(8);
    expect((steps![0] as any).slice.content.toString()).toBe('<"t">');

    act(() => {
      view.dispatch(
        view.state.tr.setSelection(TextSelection.create(view.state.doc, 7, 12))
      );
    });
    await act(async () => {
      await user.type(view.dom, "e");
    });

    expect(steps!).toHaveLength(1);
    expect((steps![0] as any).from).toBe(7);
    expect((steps![0] as any).to).toBe(12);
    expect((steps![0] as any).slice.content.toString()).toBe('<"e">');
  });
});
