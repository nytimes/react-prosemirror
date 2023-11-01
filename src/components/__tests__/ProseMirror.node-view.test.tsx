/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { act } from "@testing-library/react";
import { Plugin } from "prosemirror-state";
import { blockquote, br, doc, p } from "prosemirror-test-builder";
import { Decoration, DecorationSet } from "prosemirror-view";
import React, { LegacyRef, forwardRef, useEffect } from "react";

import { tempEditor } from "../../testing/editorViewTestHelpers.js";
import { NodeViewComponentProps } from "../NodeViewComponentProps.js";

describe("nodeViews prop", () => {
  it("can replace a node's representation", () => {
    const { view } = tempEditor({
      doc: doc(p("foo", br())),
      nodeViews: {
        hard_break: forwardRef(function Var(
          props: NodeViewComponentProps,
          ref
        ) {
          return <var ref={ref}>{props.children}</var>;
        }),
      },
    });
    expect(view.dom.querySelector("var")).not.toBeNull();
  });

  it("can override drawing of a node's content", () => {
    const { view } = tempEditor({
      doc: doc(p("foo")),
      nodeViews: {
        paragraph: forwardRef(function Paragraph(
          props: NodeViewComponentProps,
          ref
        ) {
          return (
            <p ref={ref as LegacyRef<HTMLParagraphElement>}>
              {props.nodeProps.node.textContent.toUpperCase()}
            </p>
          );
        }),
      },
    });
    expect(view.dom.querySelector("p")!.textContent).toBe("FOO");
    act(() => {
      view.dispatch(view.state.tr.insertText("a"));
    });
    expect(view.dom.querySelector("p")!.textContent).toBe("AFOO");
  });

  // React makes this more or less trivial; the render
  // method of the component _is_ the update (and create)
  // method
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip("can register its own update method", () => {
    const { view } = tempEditor({
      doc: doc(p("foo")),
      nodeViews: {
        paragraph: forwardRef(function Paragraph(
          props: NodeViewComponentProps,
          ref
        ) {
          return (
            <p ref={ref as LegacyRef<HTMLParagraphElement>}>
              {props.nodeProps.node.textContent.toUpperCase()}
            </p>
          );
        }),
      },
    });
    const para = view.dom.querySelector("p")!;
    view.dispatch(view.state.tr.insertText("a"));
    expect(view.dom.querySelector("p")).toBe(para);
    expect(para.textContent).toBe("AFOO");
  });

  it("allows decoration updates for node views with an update method", () => {
    const { view, rerender } = tempEditor({
      doc: doc(p("foo")),
      nodeViews: {
        paragraph: forwardRef(function Paragraph(
          { children, ...props }: NodeViewComponentProps,
          ref
        ) {
          return (
            <p ref={ref as LegacyRef<HTMLParagraphElement>} {...props}>
              {children}
            </p>
          );
        }),
      },
    });

    rerender({
      decorations(state) {
        return DecorationSet.create(state.doc, [
          Decoration.inline(2, 3, { someattr: "ok" }),
          Decoration.node(0, 5, { otherattr: "ok" }),
        ]);
      },
    });

    expect(view.dom.querySelector("[someattr]")).not.toBeNull();
    expect(view.dom.querySelector("[otherattr]")).not.toBeNull();
  });

  it("can provide a contentDOM property", () => {
    const { view } = tempEditor({
      doc: doc(p("foo")),
      nodeViews: {
        paragraph: forwardRef(function Paragraph(
          props: NodeViewComponentProps,
          ref
        ) {
          return (
            // ContentDOM is inferred from where props.children is rendered
            <p ref={ref as LegacyRef<HTMLParagraphElement>}>{props.children}</p>
          );
        }),
      },
    });
    const para = view.dom.querySelector("p")!;
    act(() => {
      view.dispatch(view.state.tr.insertText("a"));
    });
    expect(view.dom.querySelector("p")).toBe(para);
    expect(para.textContent).toBe("afoo");
  });

  it("has its destroy method called", () => {
    let destroyed = false;
    const { view } = tempEditor({
      doc: doc(p("foo", br())),
      nodeViews: {
        hard_break: forwardRef(function BR(
          _props: NodeViewComponentProps,
          ref
        ) {
          // React implements "destroy methods" with effect
          // hooks
          useEffect(() => {
            return () => {
              destroyed = true;
            };
          }, []);
          return <br ref={ref as LegacyRef<HTMLBRElement>} />;
        }),
      },
    });
    expect(destroyed).toBeFalsy();
    act(() => {
      view.dispatch(view.state.tr.delete(3, 5));
    });
    expect(destroyed).toBeTruthy();
  });

  it("can query its own position", () => {
    let pos: number | undefined;
    const { view } = tempEditor({
      doc: doc(blockquote(p("abc"), p("foo", br()))),
      nodeViews: {
        hard_break: forwardRef(function BR(props: NodeViewComponentProps, ref) {
          pos = props.nodeProps.pos;
          return <br ref={ref as LegacyRef<HTMLBRElement>} />;
        }),
      },
    });
    expect(pos).toBe(10);
    act(() => {
      view.dispatch(view.state.tr.insertText("a"));
    });
    expect(pos).toBe(11);
  });

  it("has access to outer decorations", () => {
    const plugin = new Plugin({
      state: {
        init() {
          return null;
        },
        apply(tr, prev) {
          return tr.getMeta("setDeco") || prev;
        },
      },
      props: {
        decorations(this: Plugin, state) {
          const deco = this.getState(state);
          return (
            deco &&
            DecorationSet.create(state.doc, [
              Decoration.inline(0, state.doc.content.size, {}, {
                name: deco,
              } as any),
            ])
          );
        },
      },
    });
    const { view } = tempEditor({
      doc: doc(p("foo", br())),
      plugins: [plugin],
      nodeViews: {
        hard_break: forwardRef(function Var(
          props: NodeViewComponentProps,
          ref
        ) {
          return (
            <var ref={ref}>
              {props.nodeProps.decorations.length
                ? props.nodeProps.decorations[0]!.spec.name
                : "[]"}
            </var>
          );
        }),
      },
    });
    expect(view.dom.querySelector("var")!.textContent).toBe("[]");
    act(() => {
      view.dispatch(view.state.tr.setMeta("setDeco", "foo"));
    });
    expect(view.dom.querySelector("var")!.textContent).toBe("foo");
    act(() => {
      view.dispatch(view.state.tr.setMeta("setDeco", "bar"));
    });
    expect(view.dom.querySelector("var")!.textContent).toBe("bar");
  });

  it("provides access to inner decorations in the constructor", () => {
    tempEditor({
      doc: doc(p("foo")),
      nodeViews: {
        paragraph: forwardRef(function Paragraph(
          props: NodeViewComponentProps,
          ref
        ) {
          expect(
            (props.nodeProps.innerDecorations as DecorationSet)
              .find()
              .map((d) => `${d.from}-${d.to}`)
              .join()
          ).toBe("1-2");
          return (
            <p ref={ref as LegacyRef<HTMLParagraphElement>}>{props.children}</p>
          );
        }),
      },
      decorations(state) {
        return DecorationSet.create(state.doc, [
          Decoration.inline(2, 3, { someattr: "ok" }),
          Decoration.node(0, 5, { otherattr: "ok" }),
        ]);
      },
    });
  });

  it("provides access to inner decorations in the update method", () => {
    let innerDecos: string[] = [];
    const { rerender } = tempEditor({
      doc: doc(p("foo")),
      nodeViews: {
        paragraph: forwardRef(function Paragraph(
          props: NodeViewComponentProps,
          ref
        ) {
          innerDecos = (props.nodeProps.innerDecorations as DecorationSet)
            .find()
            .map((d) => `${d.from}-${d.to}`);
          return (
            <p ref={ref as LegacyRef<HTMLParagraphElement>}>{props.children}</p>
          );
        }),
      },
    });

    rerender({
      decorations(state) {
        return DecorationSet.create(state.doc, [
          Decoration.inline(2, 3, { someattr: "ok" }),
          Decoration.node(0, 5, { otherattr: "ok" }),
        ]);
      },
    });

    expect(innerDecos.join()).toBe("1-2");
  });
});
