/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect } from "@jest/globals";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MatcherFunction } from "expect";
import { Node } from "prosemirror-model";
import { EditorState, Selection, TextSelection } from "prosemirror-state";
import {
  a,
  blockquote,
  doc,
  em,
  eq,
  hr,
  li,
  p,
  pre,
  strong,
  ul,
} from "prosemirror-test-builder";
import React from "react";

import { useView } from "../../hooks/useView.js";
import { EditorView as EditorViewT } from "../../prosemirror-view/index.js";
import { setupProseMirrorView } from "../../testing/setupProseMirrorView.js";
import { EditorProps, EditorView } from "../EditorView.js";

const toEqualNode: MatcherFunction<[floor: unknown, ceiling: unknown]> =
  function (actual, expected) {
    if (!(actual instanceof Node && expected instanceof Node)) {
      throw new Error("Must be comparing nodes");
    }

    const pass = eq(actual, expected);

    return {
      message: () =>
        // `this` context will have correct typings
        `expected ${this.utils.printReceived(actual)} ${
          pass ? "not " : ""
        }to equal ${this.utils.printExpected(expected)}`,
      pass,
    };
  };

expect.extend({ toEqualNode });

declare module "expect" {
  interface AsymmetricMatchers {
    toEqualNode(actual: Node): void;
  }
  interface Matchers<R> {
    toEqualNode(actual: Node): R;
  }
}

function tempEditor({
  doc: startDoc,
  selection,
  ...props
}: { doc: ReturnType<typeof doc>; selection?: Selection } & Omit<
  EditorProps,
  "state"
>): EditorViewT {
  const state = EditorState.create({
    doc: startDoc,
    selection:
      selection ?? startDoc.tag.a
        ? TextSelection.create(startDoc, startDoc.tag.a!)
        : undefined,
  });

  let view: any;

  function Test() {
    useView((v) => {
      view = v;
    });

    return null;
  }

  function TestEditor() {
    return (
      <EditorView
        defaultState={state}
        dispatchTransaction={function (tr) {
          act(() => {
            this.updateState(this.state.apply(tr));
          });
        }}
        {...props}
      >
        <Test></Test>
      </EditorView>
    );
  }
  render(<TestEditor />);

  return view;
}

describe("EditorView", () => {
  beforeAll(() => {
    setupProseMirrorView();
  });

  it("reflects the current state in .props", () => {
    const view = tempEditor({
      doc: doc(p()),
    });

    expect(view.state).toBe(view.props.state);
  });

  it("calls handleScrollToSelection when appropriate", () => {
    let scrolled = 0;

    const view = tempEditor({
      doc: doc(p()),
      handleScrollToSelection: () => {
        scrolled++;
        return false;
      },
    });

    view.dispatch(view.state.tr.scrollIntoView());

    expect(scrolled).toBe(1);
  });

  it("can be queried for the DOM position at a doc position", () => {
    const view = tempEditor({ doc: doc(ul(li(p(strong("foo"))))) });

    const inText = view.domAtPos(4);
    expect(inText.offset).toBe(1);
    expect(inText.node.nodeValue).toBe("foo");
    const beforeLI = view.domAtPos(1);
    expect(beforeLI.offset).toBe(0);
    expect(beforeLI.node.nodeName).toBe("UL");
    const afterP = view.domAtPos(7);
    expect(afterP.offset).toBe(1);
    expect(afterP.node.nodeName).toBe("LI");
  });

  it("can bias DOM position queries to enter nodes", () => {
    const view = tempEditor({
      doc: doc(p(em(strong("a"), "b"), "c")),
    });

    function get(pos: number, bias: number) {
      const r = view.domAtPos(pos, bias);
      return (
        (r.node.nodeType == 1 ? r.node.nodeName : r.node.nodeValue) +
        "@" +
        r.offset
      );
    }

    expect(get(1, 0)).toBe("P@0");
    expect(get(1, -1)).toBe("P@0");
    expect(get(1, 1)).toBe("a@0");
    expect(get(2, -1)).toBe("a@1");
    expect(get(2, 0)).toBe("EM@1");
    expect(get(2, 1)).toBe("b@0");
    expect(get(3, -1)).toBe("b@1");
    expect(get(3, 0)).toBe("P@1");
    expect(get(3, 1)).toBe("c@0");
    expect(get(4, -1)).toBe("c@1");
    expect(get(4, 0)).toBe("P@2");
    expect(get(4, 1)).toBe("P@2");
  });

  it("can be queried for a node's DOM representation", () => {
    const view = tempEditor({
      doc: doc(p("foo"), hr()),
    });

    expect(view.nodeDOM(0)!.nodeName).toBe("P");
    expect(view.nodeDOM(5)!.nodeName).toBe("HR");
    expect(view.nodeDOM(3)).toBeNull();
  });

  it("can map DOM positions to doc positions", () => {
    const view = tempEditor({
      doc: doc(p("foo"), hr()),
    });

    expect(view.posAtDOM(view.dom.firstChild!.firstChild!, 2)).toBe(3);
    expect(view.posAtDOM(view.dom, 1)).toBe(5);
    expect(view.posAtDOM(view.dom, 2)).toBe(6);
    expect(view.posAtDOM(view.dom.lastChild!, 0, -1)).toBe(5);
    expect(view.posAtDOM(view.dom.lastChild!, 0, 1)).toBe(6);
  });

  it("binds this to itself in dispatchTransaction prop", () => {
    let thisBinding: any;

    const view = tempEditor({
      doc: doc(p("foo"), hr()),
      dispatchTransaction() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        thisBinding = this;
      },
    });

    view.dispatch(view.state.tr.insertText("x"));
    expect(view).toBe(thisBinding);
  });
});

describe("DOM change", () => {
  beforeAll(() => {
    setupProseMirrorView();
  });

  it("notices when text is added", async () => {
    const view = tempEditor({ doc: doc(p("he<a>llo")) });
    const user = userEvent.setup();

    await user.type(view.dom, "L");

    expect(view.state.doc).toEqualNode(doc(p("heLllo")));
  });

  it("notices when text is removed", async () => {
    const view = tempEditor({ doc: doc(p("hell<a>o")) });
    const user = userEvent.setup();

    await user.type(view.dom, "[Backspace>2/]");

    expect(view.state.doc).toEqualNode(doc(p("heo")));
  });

  it("respects stored marks", async () => {
    const view = tempEditor({ doc: doc(p("hello<a>")) });
    const user = userEvent.setup();
    view.dispatch(
      view.state.tr.addStoredMark(view.state.schema.marks.em!.create())
    );

    await user.type(view.dom, "o");

    expect(view.state.doc).toEqualNode(doc(p("hello", em("o"))));
  });

  it("support inserting repeated text", async () => {
    const view = tempEditor({ doc: doc(p("hello")) });
    const user = userEvent.setup();
    await user.type(view.dom, "hel");

    expect(view.state.doc).toEqualNode(doc(p("helhello")));
  });

  it("detects an enter press", async () => {
    let enterPressed = false;
    const view = tempEditor({
      doc: doc(blockquote(p("foo"), p("<a>"))),
      handleKeyDown: (_, event) => {
        if (event.key === "Enter") return (enterPressed = true);
        return false;
      },
    });

    const user = userEvent.setup();
    await user.type(view.dom, "{Enter}");

    expect(enterPressed).toBeTruthy();
  });

  it("detects a simple backspace press", async () => {
    let backspacePressed = false;

    const view = tempEditor({
      doc: doc(blockquote(p("foo"), p("<a>"))),
      handleKeyDown: (_, event) => {
        if (event.key === "Backspace") return (backspacePressed = true);
        return false;
      },
    });

    const user = userEvent.setup();
    await user.type(view.dom.firstElementChild!, "{Backspace}");

    expect(backspacePressed).toBeTruthy();
  });

  it("correctly adjusts the selection", async () => {
    const user = userEvent.setup();
    const view = tempEditor({ doc: doc(p("abc<a>")) });
    await user.type(view.dom, "d");

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

  it("does not repaint a text node when it's typed into", async () => {
    const user = userEvent.setup();
    const view = tempEditor({
      doc: doc(p("fo<a>o")),
    });

    let mutated = false;
    const observer = new MutationObserver(() => (mutated = true));
    observer.observe(view.dom, {
      subtree: true,
      characterData: true,
      childList: true,
    });

    await user.type(view.dom, "j");

    expect(view.state.doc).toEqualNode(doc(p("fojo")));
    expect(mutated).toBeFalsy();
    observer.disconnect();
  });

  it("understands text typed into an empty paragraph", async () => {
    const user = userEvent.setup();
    const view = tempEditor({ doc: doc(p("<a>")) });
    await user.type(view.dom, "i");

    expect(view.state.doc).toEqualNode(doc(p("i")));
  });

  it("fixes text changes when input is ignored", async () => {
    const view = tempEditor({
      doc: doc(p("foo<a>")),
      dispatchTransaction: () => undefined,
    });
    const user = userEvent.setup();
    await user.type(view.dom, "i");
    expect(view.dom.textContent).toBe("foo");
  });

  it("aborts when an incompatible state is set", async () => {
    const view = tempEditor({ doc: doc(p("<a>abcde")) });

    view.dispatchEvent({ type: "input" } as Event);
    const user = userEvent.setup();
    await user.type(view.dom, "x");

    view.updateState(EditorState.create({ doc: doc(p("uvw")) }));
    expect(view.state.doc).toEqualNode(doc(p("uvw")));
  });

  // TODO: Investigate why this fails!
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip("preserves marks on deletion", async () => {
    const view = tempEditor({ doc: doc(p("one", em("x<a>"))) });

    const user = userEvent.setup();
    await user.type(view.dom, "[Backspace]");

    view.dispatchEvent({ type: "input" } as Event);

    view.dispatch(view.state.tr.insertText("y"));

    expect(view.state.doc).toEqualNode(doc(p("one", em("y"))));
  });

  it("works when a node's contentDOM is deleted", async () => {
    const view = tempEditor({ doc: doc(p("one"), pre("two<a>")) });
    const user = userEvent.setup();
    await user.type(view.dom, "[Backspace>3/]");
    view.dispatchEvent({ type: "input" } as Event);
    expect(view.state.doc).toEqualNode(doc(p("one"), pre()));
    expect(view.state.selection.head).toBe(6);
  });

  it("doesn't redraw content with marks when typing in front", async () => {
    const view = tempEditor({
      doc: doc(p("f<a>oo", em("bar"), strong("baz"))),
    });
    const bar = await screen.findByText("bar");
    const foo = await screen.findByText("foo");
    const user = userEvent.setup();
    await user.type(view.dom, "r");
    expect(view.state.doc).toEqualNode(
      doc(p("froo", em("bar"), strong("baz")))
    );
    expect(bar.parentNode).toBeTruthy();
    expect(view.dom.contains(bar.parentNode)).toBeTruthy();
    expect(foo.parentNode).toBeTruthy();
    expect(view.dom.contains(foo.parentNode)).toBeTruthy();
  });

  it("doesn't redraw content with marks when typing inside mark", async () => {
    const view = tempEditor({
      doc: doc(p("foo", em("b<a>ar"), strong("baz"))),
    });
    const bar = await screen.findByText("bar");
    const foo = await screen.findByText("foo");
    const user = userEvent.setup();
    await user.type(view.dom, "a");
    expect(view.state.doc).toEqualNode(
      doc(p("foo", em("baar"), strong("baz")))
    );
    expect(bar.parentNode).toBeTruthy();
    expect(view.dom.contains(bar.parentNode)).toBeTruthy();
    expect(foo.parentNode).toBeTruthy();
    expect(view.dom.contains(foo.parentNode)).toBeTruthy();
  });

  it("maps input to coordsAtPos through pending changes", () => {
    const view = tempEditor({ doc: doc(p("foo")) });
    view.dispatchEvent({ type: "input" } as Event);
    view.dispatch(view.state.tr.insertText("more text"));
    expect(view.coordsAtPos(13)).toBeTruthy();
  });

  it("notices text added to a cursor wrapper at the start of a mark", async () => {
    const view = tempEditor({ doc: doc(p(strong(a("foo<a>"), "bar"))) });
    const user = userEvent.setup();
    await user.type(view.dom, "xy");

    expect(view.state.doc).toEqualNode(doc(p(strong(a("foo"), "xybar"))));
  });

  it("removes cursor wrapper text when the wrapper otherwise remains valid", async () => {
    const view = tempEditor({ doc: doc(p(a(strong("foo<a>"), "bar"))) });
    const user = userEvent.setup();
    await user.type(view.dom, "q");
    expect(view.state.doc).toEqualNode(doc(p(a(strong("fooq"), "bar"))));
    const found = screen.queryByText("\ufeffq");
    expect(found).toBeNull();
  });

  // it("creates a correct step for an ambiguous selection-deletion", () => {
  //   let steps: Step[],
  //     view = tempEditor({
  //       doc: doc(p("la<a>la<b>la")),
  //       dispatchTransaction(tr) {
  //         steps = tr.steps;
  //         view.updateState(view.state.apply(tr));
  //       },
  //     });

  //   view.input.lastKeyCode = 8;
  //   view.input.lastKeyCodeTime = Date.now();
  //   findTextNode(view.dom, "lalala")!.nodeValue = "lala";
  //   flush(view);

  //   ist(steps!.length, 1);
  //   ist((steps![0] as any).from, 3);
  //   ist((steps![0] as any).to, 5);
  // });

  // it("creates a step that covers the entire selection for partially-matching replacement", () => {
  //   let steps: Step[],
  //     view = tempEditor({
  //       doc: doc(p("one <a>two<b> three")),
  //       dispatchTransaction(tr) {
  //         steps = tr.steps;
  //         view.updateState(view.state.apply(tr));
  //       },
  //     });

  //   findTextNode(view.dom, "one two three")!.nodeValue = "one t three";
  //   flush(view);
  //   ist(steps!.length, 1);
  //   ist((steps![0] as any).from, 5);
  //   ist((steps![0] as any).to, 8);
  //   ist((steps![0] as any).slice.content.toString(), '<"t">');

  //   view.dispatch(
  //     view.state.tr.setSelection(TextSelection.create(view.state.doc, 7, 12))
  //   );
  //   findTextNode(view.dom, "one t three")!.nodeValue = "one t e";
  //   flush(view);
  //   ist(steps!.length, 1);
  //   ist((steps![0] as any).from, 7);
  //   ist((steps![0] as any).to, 12);
  //   ist((steps![0] as any).slice.content.toString(), '<"e">');
  // });
});
