/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { render } from "@testing-library/react";
import { EditorState } from "prosemirror-state";
import {
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

  // This one doesn't work yet!
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
            return this.state;
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
