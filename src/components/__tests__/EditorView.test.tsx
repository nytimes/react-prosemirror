/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditorState, TextSelection } from "prosemirror-state";
import {
  blockquote,
  doc,
  em,
  hr,
  li,
  p,
  schema,
  strong,
  ul,
} from "prosemirror-test-builder";
import React from "react";

import { useView } from "../../hooks/useView.js";
import { setupProseMirrorView } from "../../testing/setupProseMirrorView.js";
import { EditorView } from "../EditorView.js";

describe("EditorView", () => {
  beforeAll(() => {
    setupProseMirrorView();
  });

  it("reflects the current state in .props", () => {
    const editorState = EditorState.create({ schema });

    function Test() {
      useView((view) => {
        expect(view.state).toBe(view.props.state);
      });

      return null;
    }

    function TestEditor() {
      return (
        <EditorView defaultState={editorState}>
          <Test></Test>
        </EditorView>
      );
    }
    render(<TestEditor />);
  });

  // TODO: This one doesn't work yet!
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip("calls handleScrollToSelection when appropriate", () => {
    const editorState = EditorState.create({ schema });
    let scrolled = 0;

    const { rerender } = render(
      <EditorView
        state={editorState}
        handleScrollToSelection={() => {
          scrolled++;
          return false;
        }}
      />
    );

    rerender(
      <EditorView
        state={editorState.apply(editorState.tr.scrollIntoView())}
        handleScrollToSelection={() => {
          scrolled++;
          return false;
        }}
      />
    );

    expect(scrolled).toBe(1);
  });

  it("can be queried for the DOM position at a doc position", () => {
    const state = EditorState.create({ doc: doc(ul(li(p(strong("foo"))))) });

    function Test() {
      useView((view) => {
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

      return null;
    }

    function TestEditor() {
      return (
        <EditorView defaultState={state}>
          <Test></Test>
        </EditorView>
      );
    }
    render(<TestEditor />);
  });

  it("can bias DOM position queries to enter nodes", () => {
    const state = EditorState.create({
      doc: doc(p(em(strong("a"), "b"), "c")),
    });

    function Test() {
      useView((view) => {
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

      return null;
    }

    function TestEditor() {
      return (
        <EditorView defaultState={state}>
          <Test></Test>
        </EditorView>
      );
    }
    render(<TestEditor />);
  });

  it("can be queried for a node's DOM representation", () => {
    const state = EditorState.create({
      doc: doc(p("foo"), hr()),
    });

    function Test() {
      useView((view) => {
        expect(view.nodeDOM(0)!.nodeName).toBe("P");
        expect(view.nodeDOM(5)!.nodeName).toBe("HR");
        expect(view.nodeDOM(3)).toBeNull();
      });

      return null;
    }

    function TestEditor() {
      return (
        <EditorView defaultState={state}>
          <Test></Test>
        </EditorView>
      );
    }
    render(<TestEditor />);
  });

  it("can map DOM positions to doc positions", () => {
    const state = EditorState.create({
      doc: doc(p("foo"), hr()),
    });

    function Test() {
      useView((view) => {
        expect(view.posAtDOM(view.dom.firstChild!.firstChild!, 2)).toBe(3);
        expect(view.posAtDOM(view.dom, 1)).toBe(5);
        expect(view.posAtDOM(view.dom, 2)).toBe(6);
        expect(view.posAtDOM(view.dom.lastChild!, 0, -1)).toBe(5);
        expect(view.posAtDOM(view.dom.lastChild!, 0, 1)).toBe(6);
      });

      return null;
    }

    function TestEditor() {
      return (
        <EditorView defaultState={state}>
          <Test></Test>
        </EditorView>
      );
    }
    render(<TestEditor />);
  });

  it("binds this to itself in dispatchTransaction prop", () => {
    const state = EditorState.create({
      doc: doc(p("foo"), hr()),
    });

    let view: any;
    let thisBinding: any;

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
          dispatchTransaction={function () {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            thisBinding = this;
          }}
        >
          <Test></Test>
        </EditorView>
      );
    }
    render(<TestEditor />);
    view.dispatch(view.state.tr.insertText("x"));
    expect(view).toBe(thisBinding);
  });
});

describe("DOM change", () => {
  beforeAll(() => {
    setupProseMirrorView();
  });

  it("notices when text is added", async () => {
    const startDoc = doc(p("hello"));
    const state = EditorState.create({
      doc: startDoc,
      selection: TextSelection.create(startDoc, 3),
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
        >
          <Test></Test>
        </EditorView>
      );
    }
    const user = userEvent.setup();
    render(<TestEditor />);
    const graf = await screen.findByText("hello");
    await user.type(graf, "L");

    expect(view.state.doc.eq(doc(p("heLllo")))).toBeTruthy();
  });

  it("notices when text is removed", async () => {
    const startDoc = doc(p("hello"));
    const state = EditorState.create({
      doc: startDoc,
      selection: TextSelection.create(startDoc, 5),
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
        >
          <Test></Test>
        </EditorView>
      );
    }
    const user = userEvent.setup();
    render(<TestEditor />);
    const graf = await screen.findByText("hello");
    await user.type(graf, "[Backspace>2/]");

    expect(view.state.doc.eq(doc(p("heo")))).toBeTruthy();
  });

  it("respects stored marks", async () => {
    const startDoc = doc(p("hello"));
    const state = EditorState.create({
      doc: startDoc,
      selection: TextSelection.create(startDoc, 6),
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
        >
          <Test></Test>
        </EditorView>
      );
    }
    const user = userEvent.setup();
    render(<TestEditor />);
    view.dispatch(
      view.state.tr.addStoredMark(view.state.schema.marks.em.create())
    );

    const graf = await screen.findByText("hello");
    await user.type(graf, "o");

    expect(view.state.doc.eq(doc(p("hello", em("o"))))).toBeTruthy();
  });

  it("support inserting repeated text", async () => {
    const startDoc = doc(p("hello"));
    const state = EditorState.create({
      doc: startDoc,
      selection: TextSelection.create(startDoc, 1),
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
        >
          <Test></Test>
        </EditorView>
      );
    }
    const user = userEvent.setup();
    render(<TestEditor />);
    const graf = await screen.findByText("hello");
    await user.type(graf, "hel");

    expect(view.state.doc.eq(doc(p("helhello")))).toBeTruthy();
  });

  it("detects an enter press", async () => {
    const startDoc = doc(blockquote(p("foo"), p("<a>")));
    const state = EditorState.create({
      doc: startDoc,
    });

    let enterPressed = false;

    function TestEditor() {
      return (
        <EditorView
          defaultState={state}
          handleKeyDown={(_, event) => {
            if (event.key === "Enter") return (enterPressed = true);
            return false;
          }}
          dispatchTransaction={function (tr) {
            act(() => {
              this.updateState(this.state.apply(tr));
            });
          }}
        ></EditorView>
      );
    }
    const user = userEvent.setup();
    render(<TestEditor />);
    const bq = (await screen.findByText("foo")).parentElement!;
    await user.type(bq, "{Enter}");

    expect(enterPressed).toBeTruthy();
  });

  it("detects a simple backspace press", async () => {
    const startDoc = doc(blockquote(p("foo"), p("<a>")));
    const state = EditorState.create({
      doc: startDoc,
      selection: TextSelection.create(startDoc, 7),
    });

    let backspacePressed = false;

    function TestEditor() {
      return (
        <EditorView
          defaultState={state}
          handleKeyDown={(_, event) => {
            if (event.key === "Backspace") return (backspacePressed = true);
            return false;
          }}
          dispatchTransaction={function (tr) {
            act(() => {
              this.updateState(this.state.apply(tr));
            });
          }}
        ></EditorView>
      );
    }
    const user = userEvent.setup();
    render(<TestEditor />);
    const bq = (await screen.findByText("foo")).parentElement!;
    await user.type(bq, "{Backspace}");

    expect(backspacePressed).toBeTruthy();
  });

  it("correctly adjusts the selection", async () => {
    const startDoc = doc(p("abc"));
    const state = EditorState.create({
      doc: startDoc,
      selection: TextSelection.create(startDoc, 4),
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
        >
          <Test></Test>
        </EditorView>
      );
    }
    const user = userEvent.setup();
    render(<TestEditor />);
    const graf = await screen.findByText("abc");
    await user.type(graf, "d");

    expect(view.state.doc.eq(doc(p("abcd")))).toBeTruthy();
    expect(view.state.selection.anchor).toBe(5);
    expect(view.state.selection.head).toBe(5);
  });

  // it("handles splitting of a textblock", () => {
  //   let view = tempEditor({ doc: doc(h1("abc"), p("defg<a>")) });
  //   let para = view.dom.querySelector("p")!;
  //   let split = para.parentNode!.appendChild(para.cloneNode()) as HTMLElement;
  //   split.innerHTML = "fg";
  //   findTextNode(para, "defg")!.nodeValue = "dexy";
  //   setSel(split.firstChild!, 1);
  //   flush(view);
  //   ist(view.state.doc, doc(h1("abc"), p("dexy"), p("fg")), eq);
  //   ist(view.state.selection.anchor, 13);
  // });

  // it("handles a deep split of nodes", () => {
  //   let view = tempEditor({ doc: doc(blockquote(p("ab<a>cd"))) });
  //   let quote = view.dom.querySelector("blockquote")!;
  //   let quote2 = view.dom.appendChild(quote.cloneNode(true));
  //   findTextNode(quote, "abcd")!.nodeValue = "abx";
  //   let text2 = findTextNode(quote2, "abcd")!;
  //   text2.nodeValue = "cd";
  //   setSel(text2.parentNode!, 0);
  //   flush(view);
  //   ist(view.state.doc, doc(blockquote(p("abx")), blockquote(p("cd"))), eq);
  //   ist(view.state.selection.anchor, 9);
  // });

  // it("can delete the third instance of a character", () => {
  //   let view = tempEditor({ doc: doc(p("foo xxx<a> bar")) });
  //   findTextNode(view.dom, "foo xxx bar")!.nodeValue = "foo xx bar";
  //   flush(view);
  //   ist(view.state.doc, doc(p("foo xx bar")), eq);
  // });

  // it("can read a simple composition", () => {
  //   let view = tempEditor({ doc: doc(p("hello")) });
  //   findTextNode(view.dom, "hello")!.nodeValue = "hellox";
  //   flush(view);
  //   ist(view.state.doc, doc(p("hellox")), eq);
  // });

  // it("can delete text in markup", () => {
  //   let view = tempEditor({
  //     doc: doc(p("a", em("b", img, strong("cd<a>")), "e")),
  //   });
  //   findTextNode(view.dom, "cd")!.nodeValue = "c";
  //   flush(view);
  //   ist(view.state.doc, doc(p("a", em("b", img, strong("c")), "e")), eq);
  // });

  // it("recognizes typing inside markup", () => {
  //   let view = tempEditor({
  //     doc: doc(p("a", em("b", img, strong("cd<a>")), "e")),
  //   });
  //   findTextNode(view.dom, "cd")!.nodeValue = "cdxy";
  //   flush(view);
  //   ist(view.state.doc, doc(p("a", em("b", img, strong("cdxy")), "e")), eq);
  // });

  // it("resolves ambiguous text input", () => {
  //   let view = tempEditor({ doc: doc(p("fo<a>o")) });
  //   view.dispatch(
  //     view.state.tr.addStoredMark(view.state.schema.marks.strong.create())
  //   );
  //   findTextNode(view.dom, "foo")!.nodeValue = "fooo";
  //   flush(view);
  //   ist(view.state.doc, doc(p("fo", strong("o"), "o")), eq);
  // });

  // it("does not repaint a text node when it's typed into", () => {
  //   let view = tempEditor({ doc: doc(p("fo<a>o")) });
  //   findTextNode(view.dom, "foo")!.nodeValue = "fojo";
  //   let mutated = false,
  //     observer = new MutationObserver(() => (mutated = true));
  //   observer.observe(view.dom, {
  //     subtree: true,
  //     characterData: true,
  //     childList: true,
  //   });
  //   flush(view);
  //   ist(view.state.doc, doc(p("fojo")), eq);
  //   ist(!mutated);
  //   observer.disconnect();
  // });

  // it("understands text typed into an empty paragraph", () => {
  //   let view = tempEditor({ doc: doc(p("<a>")) });
  //   view.dom.querySelector("p")!.textContent = "i";
  //   flush(view);
  //   ist(view.state.doc, doc(p("i")), eq);
  // });

  // it("doesn't treat a placeholder BR as real content", () => {
  //   let view = tempEditor({ doc: doc(p("i<a>")) });
  //   view.dom.querySelector("p")!.innerHTML = "<br>";
  //   flush(view);
  //   ist(view.state.doc, doc(p()), eq);
  // });

  // it("fixes text changes when input is ignored", () => {
  //   let view = tempEditor({
  //     doc: doc(p("foo")),
  //     dispatchTransaction: () => undefined,
  //   });
  //   findTextNode(view.dom, "foo")!.nodeValue = "food";
  //   flush(view);
  //   ist(view.dom.textContent, "foo");
  // });

  // it("fixes structure changes when input is ignored", () => {
  //   let view = tempEditor({
  //     doc: doc(p("foo", br(), "bar")),
  //     dispatchTransaction: () => null,
  //   });
  //   let para = view.dom.querySelector("p")!;
  //   para.replaceChild(document.createElement("img"), para.lastChild!);
  //   flush(view);
  //   ist(view.dom.textContent, "foobar");
  // });

  // it("aborts when an incompatible state is set", () => {
  //   let view = tempEditor({ doc: doc(p("abcde")) });
  //   findTextNode(view.dom, "abcde")!.nodeValue = "xabcde";
  //   view.dispatchEvent({ type: "input" } as Event);
  //   view.updateState(EditorState.create({ doc: doc(p("uvw")) }));
  //   flush(view);
  //   ist(view.state.doc, doc(p("uvw")), eq);
  // });

  // it("recognizes a mark change as such", () => {
  //   let view = tempEditor({
  //     doc: doc(p("one")),
  //     dispatchTransaction(tr) {
  //       ist(tr.steps.length, 1);
  //       ist(tr.steps[0].toJSON().stepType, "addMark");
  //       view.updateState(view.state.apply(tr));
  //     },
  //   });
  //   view.dom.querySelector("p")!.innerHTML = "<b>one</b>";
  //   flush(view);
  //   ist(view.state.doc, doc(p(strong("one"))), eq);
  // });

  // it("preserves marks on deletion", () => {
  //   let view = tempEditor({ doc: doc(p("one", em("x<a>"))) });
  //   view.dom.querySelector("em")!.innerText = "";
  //   view.dispatchEvent({ type: "input" } as Event);
  //   flush(view);
  //   view.dispatch(view.state.tr.insertText("y"));
  //   ist(view.state.doc, doc(p("one", em("y"))), eq);
  // });

  // it("works when a node's contentDOM is deleted", () => {
  //   let view = tempEditor({ doc: doc(p("one"), pre("two<a>")) });
  //   view.dom.querySelector("pre")!.innerText = "";
  //   view.dispatchEvent({ type: "input" } as Event);
  //   flush(view);
  //   ist(view.state.doc, doc(p("one"), pre()), eq);
  //   ist(view.state.selection.head, 6);
  // });

  // it("doesn't redraw content with marks when typing in front", () => {
  //   let view = tempEditor({ doc: doc(p("foo", em("bar"), strong("baz"))) });
  //   let bar = findTextNode(view.dom, "bar")!,
  //     foo = findTextNode(view.dom, "foo")!;
  //   foo.nodeValue = "froo";
  //   flush(view);
  //   ist(view.state.doc, doc(p("froo", em("bar"), strong("baz"))), eq);
  //   ist(bar.parentNode && view.dom.contains(bar.parentNode));
  //   ist(foo.parentNode && view.dom.contains(foo.parentNode));
  // });

  // it("doesn't redraw content with marks when typing inside mark", () => {
  //   let view = tempEditor({ doc: doc(p("foo", em("bar"), strong("baz"))) });
  //   let bar = findTextNode(view.dom, "bar")!,
  //     foo = findTextNode(view.dom, "foo")!;
  //   bar.nodeValue = "baar";
  //   flush(view);
  //   ist(view.state.doc, doc(p("foo", em("baar"), strong("baz"))), eq);
  //   ist(bar.parentNode && view.dom.contains(bar.parentNode));
  //   ist(foo.parentNode && view.dom.contains(foo.parentNode));
  // });

  // it("maps input to coordsAtPos through pending changes", () => {
  //   let view = tempEditor({ doc: doc(p("foo")) });
  //   view.dispatchEvent({ type: "input" } as Event);
  //   view.dispatch(view.state.tr.insertText("more text"));
  //   ist(view.coordsAtPos(13));
  // });

  // it("notices text added to a cursor wrapper at the start of a mark", () => {
  //   let view = tempEditor({ doc: doc(p(strong(a("foo<a>"), "bar"))) });
  //   findTextNode(view.dom, "foo")!.nodeValue = "fooxy";
  //   flush(view);
  //   ist(view.state.doc, doc(p(strong(a("foo"), "xybar"))), eq);
  // });

  // it("removes cursor wrapper text when the wrapper otherwise remains valid", () => {
  //   let view = tempEditor({ doc: doc(p(a(strong("foo<a>"), "bar"))) });
  //   findTextNode(view.dom, "foo")!.nodeValue = "fooq";
  //   flush(view);
  //   ist(view.state.doc, doc(p(a(strong("fooq"), "bar"))), eq);
  //   ist(!findTextNode(view.dom, "\ufeffq"));
  // });

  // it("doesn't confuse backspace with delete", () => {
  //   let steps: Step[],
  //     view = tempEditor({
  //       doc: doc(p("a<a>a")),
  //       dispatchTransaction(tr) {
  //         steps = tr.steps;
  //         view.updateState(view.state.apply(tr));
  //       },
  //     });

  //   view.input.lastKeyCode = 8;
  //   view.input.lastKeyCodeTime = Date.now();
  //   findTextNode(view.dom, "aa")!.nodeValue = "a";
  //   flush(view);

  //   ist(steps!.length, 1);
  //   ist((steps![0] as any).from, 1);
  //   ist((steps![0] as any).to, 2);
  // });

  // it("can disambiguate a multiple-character backspace event", () => {
  //   let steps: Step[],
  //     view = tempEditor({
  //       doc: doc(p("foo<a>foo")),
  //       dispatchTransaction(tr) {
  //         steps = tr.steps;
  //         view.updateState(view.state.apply(tr));
  //       },
  //     });

  //   view.input.lastKeyCode = 8;
  //   view.input.lastKeyCodeTime = Date.now();
  //   findTextNode(view.dom, "foofoo")!.nodeValue = "foo";
  //   flush(view);

  //   ist(steps!.length, 1);
  //   ist((steps![0] as any).from, 1);
  //   ist((steps![0] as any).to, 4);
  // });

  // it("doesn't confuse delete with backspace", () => {
  //   let steps: Step[],
  //     view = tempEditor({
  //       doc: doc(p("a<a>a")),
  //       dispatchTransaction(tr) {
  //         steps = tr.steps;
  //         view.updateState(view.state.apply(tr));
  //       },
  //     });

  //   findTextNode(view.dom, "aa")!.nodeValue = "a";
  //   flush(view);

  //   ist(steps!.length, 1);
  //   ist((steps![0] as any).from, 2);
  //   ist((steps![0] as any).to, 3);
  // });

  // it("doesn't confuse delete with backspace for multi-character deletions", () => {
  //   let steps: Step[],
  //     view = tempEditor({
  //       doc: doc(p("one foo<a>foo three")),
  //       dispatchTransaction(tr) {
  //         steps = tr.steps;
  //         view.updateState(view.state.apply(tr));
  //       },
  //     });

  //   findTextNode(view.dom, "one foofoo three")!.nodeValue = "one foo three";
  //   flush(view);

  //   ist(steps!.length, 1);
  //   ist((steps![0] as any).from, 8);
  //   ist((steps![0] as any).to, 11);
  // });

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
