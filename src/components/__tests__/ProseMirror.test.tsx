/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect } from "@jest/globals";
import { act } from "@testing-library/react";
import { doc, em, hr, li, p, strong, ul } from "prosemirror-test-builder";

import { tempEditor } from "../../testing/editorViewTestHelpers.js";
import { setupProseMirrorView } from "../../testing/setupProseMirrorView.js";

describe("EditorView", () => {
  beforeAll(() => {
    setupProseMirrorView();
  });

  it("reflects the current state in .props", () => {
    const { view } = tempEditor({
      doc: doc(p()),
    });

    expect(view.state).toBe(view.props.state);
  });

  it("calls handleScrollToSelection when appropriate", () => {
    let scrolled = 0;

    const { view } = tempEditor({
      doc: doc(p()),
      handleScrollToSelection: () => {
        scrolled++;
        return false;
      },
    });

    act(() => {
      view.dispatch(view.state.tr.scrollIntoView());
    });

    expect(scrolled).toBe(1);
  });

  it("can be queried for the DOM position at a doc position", () => {
    const { view } = tempEditor({ doc: doc(ul(li(p(strong("foo"))))) });

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
    const { view } = tempEditor({
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
    const { view } = tempEditor({
      doc: doc(p("foo"), hr()),
    });

    expect(view.nodeDOM(0)!.nodeName).toBe("P");
    expect(view.nodeDOM(5)!.nodeName).toBe("HR");
    expect(view.nodeDOM(3)).toBeNull();
  });

  it("can map DOM positions to doc positions", () => {
    const { view } = tempEditor({
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

    const { view } = tempEditor({
      doc: doc(p("foo"), hr()),
      dispatchTransaction() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        thisBinding = this;
      },
    });

    act(() => {
      view.dispatch(view.state.tr.insertText("x"));
    });
    expect(view).toBe(thisBinding);
  });
});
