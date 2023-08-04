import { render } from "@testing-library/react";
import { EditorState } from "prosemirror-state";
import { doc, li, p, schema, strong, ul } from "prosemirror-test-builder";
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
});
