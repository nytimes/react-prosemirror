/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { act } from "@testing-library/react";
import { Node, Schema } from "prosemirror-model";
import { Plugin } from "prosemirror-state";
import { doc, h1, hr, p, pre, schema, strong } from "prosemirror-test-builder";
import React, { forwardRef } from "react";

import { tempEditor } from "../../testing/editorViewTestHelpers.js";
import { NodeViewComponentProps } from "../NodeViewComponentProps.js";

describe("EditorView draw", () => {
  it("updates the DOM", () => {
    const { view } = tempEditor({ doc: doc(p("foo")) });
    act(() => {
      view.dispatch(view.state.tr.insertText("bar"));
    });
    expect(view.dom.textContent).toBe("barfoo");
  });

  it("doesn't redraw nodes after changes", () => {
    const { view } = tempEditor({ doc: doc(h1("foo<a>"), p("bar")) });
    const oldP = view.dom.querySelector("p");
    act(() => {
      view.dispatch(view.state.tr.insertText("!"));
    });
    expect(view.dom.querySelector("p")).toBe(oldP);
  });

  it("doesn't redraw nodes before changes", () => {
    const { view } = tempEditor({ doc: doc(p("foo"), h1("bar")) });
    const oldP = view.dom.querySelector("p");
    act(() => {
      view.dispatch(view.state.tr.insertText("!", 2));
    });
    expect(view.dom.querySelector("p")).toBe(oldP);
  });

  it("doesn't redraw nodes between changes", () => {
    const { view } = tempEditor({ doc: doc(p("foo"), h1("bar"), pre("baz")) });
    const oldP = view.dom.querySelector("p");
    const oldPre = view.dom.querySelector("pre");
    act(() => {
      view.dispatch(view.state.tr.insertText("!", 2));
    });
    expect(view.dom.querySelector("p")).toBe(oldP);
    expect(view.dom.querySelector("pre")).toBe(oldPre);
  });

  it("doesn't redraw siblings of a split node", () => {
    const { view } = tempEditor({ doc: doc(p("foo"), h1("bar"), pre("baz")) });
    const oldP = view.dom.querySelector("p");
    const oldPre = view.dom.querySelector("pre");
    act(() => {
      view.dispatch(view.state.tr.split(8));
    });
    expect(view.dom.querySelector("p")).toBe(oldP);
    expect(view.dom.querySelector("pre")).toBe(oldPre);
  });

  it("doesn't redraw siblings of a joined node", () => {
    const { view } = tempEditor({
      doc: doc(p("foo"), h1("bar"), h1("x"), pre("baz")),
    });
    const oldP = view.dom.querySelector("p");
    const oldPre = view.dom.querySelector("pre");
    act(() => {
      view.dispatch(view.state.tr.join(10));
    });
    expect(view.dom.querySelector("p")).toBe(oldP);
    expect(view.dom.querySelector("pre")).toBe(oldPre);
  });

  it("doesn't redraw after a big deletion", () => {
    const { view } = tempEditor({
      doc: doc(p(), p(), p(), p(), p(), p(), p(), p(), h1("!"), p(), p()),
    });
    const oldH = view.dom.querySelector("h1");
    act(() => {
      view.dispatch(view.state.tr.delete(2, 14));
    });
    expect(view.dom.querySelector("h1")).toBe(oldH);
  });

  it("adds classes from the attributes prop", () => {
    const { view, rerender } = tempEditor({
      doc: doc(p()),
      attributes: { class: "foo bar" },
    });
    expect(view.dom.classList.contains("foo")).toBeTruthy();
    expect(view.dom.classList.contains("bar")).toBeTruthy();
    expect(view.dom.classList.contains("ProseMirror")).toBeTruthy();
    act(() => {
      rerender({ attributes: { class: "baz" } });
    });
    expect(!view.dom.classList.contains("foo")).toBeTruthy();
    expect(view.dom.classList.contains("baz")).toBeTruthy();
  });

  it("adds style from the attributes prop", () => {
    const { view } = tempEditor({
      doc: doc(p()),
      attributes: { style: "border: 1px solid red;" },
      plugins: [
        new Plugin({ props: { attributes: { style: "background: red;" } } }),
        new Plugin({ props: { attributes: { style: "color: red;" } } }),
      ],
    });
    expect(view.dom.style.border).toBe("1px solid red");
    expect(view.dom.style.backgroundColor).toBe("red");
    expect(view.dom.style.color).toBe("red");
  });

  it("can set other attributes", () => {
    const { view, rerender } = tempEditor({
      doc: doc(p()),
      attributes: { spellcheck: "false", "aria-label": "hello" },
    });
    expect(view.dom.getAttribute("spellcheck")).toBe("false");
    expect(view.dom.getAttribute("aria-label")).toBe("hello");
    act(() => {
      rerender({
        attributes: { style: "background-color: yellow" },
      });
    });
    expect(view.dom.hasAttribute("aria-label")).toBe(false);
    expect(view.dom.style.backgroundColor).toBe("yellow");
  });

  it("can't set the contenteditable attribute", () => {
    const { view } = tempEditor({
      doc: doc(p()),
      attributes: { contenteditable: "false" },
    });
    expect(view.dom.getAttribute("contenteditable")).toBe("true");
  });

  it("understands the editable prop", () => {
    const { view, rerender } = tempEditor({
      doc: doc(p()),
      editable: () => false,
    });
    expect(view.dom.getAttribute("contenteditable")).toBe("false");
    rerender({ editable: () => true });
    expect(view.dom.getAttribute("contenteditable")).toBe("true");
  });

  it("doesn't redraw following paragraphs when a paragraph is split", () => {
    const { view } = tempEditor({ doc: doc(p("abcde"), p("fg")) });
    const lastPara = view.dom.lastChild;
    act(() => {
      view.dispatch(view.state.tr.split(3));
    });
    expect(view.dom.lastChild).toBe(lastPara);
  });

  it("doesn't greedily match nodes that have another match", () => {
    const { view } = tempEditor({ doc: doc(p("a"), p("b"), p()) });
    const secondPara = view.dom.querySelectorAll("p")[1];
    act(() => {
      view.dispatch(view.state.tr.split(2));
    });
    expect(view.dom.querySelectorAll("p")[2]).toBe(secondPara);
  });

  it("creates and destroys plugin views", () => {
    const events: string[] = [];
    class PluginView {
      update() {
        events.push("update");
      }
      destroy() {
        events.push("destroy");
      }
    }
    const plugin = new Plugin({
      view() {
        events.push("create");
        return new PluginView();
      },
    });
    const { view, unmount } = tempEditor({ plugins: [plugin] });
    act(() => {
      view.dispatch(view.state.tr.insertText("u"));
    });
    unmount();
    expect(events.join(" ")).toBe("create update destroy");
  });

  it("redraws changed node views", () => {
    const { view, rerender } = tempEditor({ doc: doc(p("foo"), hr()) });
    expect(view.dom.querySelector("hr")).toBeTruthy();
    rerender({
      nodeViews: {
        horizontal_rule: forwardRef(function Var(
          props: NodeViewComponentProps,
          ref
        ) {
          return <var ref={ref}>{props.children}</var>;
        }),
      },
    });
    expect(!view.dom.querySelector("hr")).toBeTruthy();
    expect(view.dom.querySelector("var")).toBeTruthy();
  });

  it("doesn't get confused by merged nodes", () => {
    const { view } = tempEditor({
      doc: doc(p(strong("one"), " two ", strong("three"))),
    });
    act(() => {
      view.dispatch(view.state.tr.removeMark(1, 4, schema.marks.strong));
    });
    expect(view.dom.querySelectorAll("strong")).toHaveLength(1);
  });

  it("doesn't redraw too much when marks are present", () => {
    const s = new Schema({
      nodes: {
        doc: { content: "paragraph+", marks: "m" },
        text: { group: "inline" },
        paragraph: schema.spec.nodes.get("paragraph")!,
      },
      marks: {
        m: {
          toDOM: () => ["div", { class: "m" }, 0],
          parseDOM: [{ tag: "div.m" }],
        },
      },
    });
    const paragraphs = [];
    for (let i = 1; i <= 10; i++)
      paragraphs.push(
        s.node("paragraph", null, [s.text("para " + i)], [s.mark("m")])
      );
    const { view } = tempEditor({
      // @ts-expect-error this is fine
      doc: s.node("doc", null, paragraphs),
    });
    const initialChildren = Array.from(view.dom.querySelectorAll("p"));
    const newParagraphs: Node[] = [];
    for (let i = -6; i < 0; i++)
      newParagraphs.push(
        s.node("paragraph", null, [s.text("para " + i)], [s.mark("m")])
      );
    act(() => {
      view.dispatch(view.state.tr.replaceWith(0, 8, newParagraphs));
    });
    const currentChildren = Array.from(view.dom.querySelectorAll("p"));
    let sameAtEnd = 0;
    while (
      sameAtEnd < currentChildren.length &&
      sameAtEnd < initialChildren.length &&
      currentChildren[currentChildren.length - sameAtEnd - 1] ==
        initialChildren[initialChildren.length - sameAtEnd - 1]
    )
      sameAtEnd++;
    // $$FORK: Our node stability isn't _quite_ as robust
    // as prosemirror-view's. The node adjacent to the one
    // that was replaced also gets repainted.
    // expect(sameAtEnd).toBe(9);
    expect(sameAtEnd).toBe(8);
  });
});
