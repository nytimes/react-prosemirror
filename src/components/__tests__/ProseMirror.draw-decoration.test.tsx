/* eslint-disable @typescript-eslint/no-non-null-assertion */

// TODO: figure out whether it's possible to support native
// widgets. Right now, I'm not sure how we'd do it without
// wrapping them in another element, which would re-introduce
// all of the issues we had before with node views.
//
// For now, we've updated the factory in this file to use
// our React widgets.

import { act } from "@testing-library/react";
import { Schema } from "prosemirror-model";
import { Plugin, TextSelection } from "prosemirror-state";
import {
  blockquote,
  doc,
  em,
  h1,
  hr,
  img,
  p,
  schema,
  strong,
} from "prosemirror-test-builder";
import React, { LegacyRef, forwardRef, useEffect } from "react";

import { widget } from "../../decorations/ReactWidgetType.js";
import { useEditorEffect } from "../../hooks/useEditorEffect.js";
import {
  Decoration,
  DecorationSet,
  DecorationSource,
  EditorView,
} from "../../prosemirror-view/index.js";
import { tempEditor } from "../../testing/editorViewTestHelpers.js";
import { NodeViewComponentProps } from "../NodeViewComponentProps.js";
import { WidgetViewComponentProps } from "../WidgetViewComponentProps.js";

const Widget = forwardRef<HTMLElement>(function Widget(props, ref) {
  return (
    <button ref={ref as LegacyRef<HTMLButtonElement>} {...props}>
      ω
    </button>
  );
});

function make(str: string | Decoration): Decoration {
  if (typeof str != "string") return str;
  const match = /^(\d+)(?:-(\d+))?-(.+)$/.exec(str)!;
  if (match[3] == "widget") {
    return widget(+match[1]!, Widget, { key: str });
  }
  return Decoration.inline(+match[1]!, +match[2]!, { class: match[3] });
}

function decoPlugin(decos: readonly (string | Decoration)[]) {
  return new Plugin({
    state: {
      init(config) {
        return DecorationSet.create(config.doc!, decos.map(make));
      },
      apply(tr, set, state) {
        if (tr.docChanged) set = set.map(tr.mapping, tr.doc);
        const change = tr.getMeta("updateDecorations");
        if (change) {
          if (change.remove) set = set.remove(change.remove);
          if (change.add) set = set.add(state.doc, change.add);
        }
        return set;
      },
    },
    props: {
      decorations(this: Plugin, state) {
        return this.getState(state);
      },
    },
  });
}

function updateDeco(
  view: EditorView,
  add: readonly Decoration[] | null,
  remove?: readonly Decoration[]
) {
  view.dispatch(view.state.tr.setMeta("updateDecorations", { add, remove }));
}

describe("Decoration drawing", () => {
  it("draws inline decorations", () => {
    const { view } = tempEditor({
      doc: doc(p("foobar")),
      plugins: [decoPlugin(["2-5-foo"])],
    });
    const found = view.dom.querySelector(".foo")!;
    expect(found).not.toBeNull();
    expect(found.textContent).toBe("oob");
  });

  it("draws wrapping decorations", () => {
    const { view } = tempEditor({
      doc: doc(p("foo")),
      plugins: [decoPlugin([Decoration.inline(1, 5, { nodeName: "i" })])],
    });
    const found = view.dom.querySelector("i");
    expect(found && found.innerHTML).toBe("foo");
  });

  it("draws node decorations", () => {
    const { view } = tempEditor({
      doc: doc(p("foo"), p("bar")),
      plugins: [decoPlugin([Decoration.node(5, 10, { class: "cls" })])],
    });
    const found = view.dom.querySelectorAll(".cls");
    expect(found).toHaveLength(1);
    expect(found[0]!.nodeName).toBe("P");
    expect(found[0]!.previousSibling!.nodeName).toBe("P");
  });

  it("can update multi-level wrapping decorations", () => {
    const d2 = Decoration.inline(1, 5, { nodeName: "i", class: "b" });
    const { view } = tempEditor({
      doc: doc(p("hello")),
      plugins: [
        decoPlugin([
          Decoration.inline(1, 5, { nodeName: "i", class: "a" }),
          d2,
        ]),
      ],
    });
    expect(view.dom.querySelectorAll("i")).toHaveLength(2);
    act(() => {
      updateDeco(
        view,
        [Decoration.inline(1, 5, { nodeName: "i", class: "c" })],
        [d2]
      );
    });
    const iNodes = view.dom.querySelectorAll("i");
    expect(iNodes).toHaveLength(2);
    expect(
      Array.prototype.map
        .call(iNodes, (n) => n.className)
        .sort()
        .join()
    ).toBe("a,c");
  });

  it("draws overlapping inline decorations", () => {
    const { view } = tempEditor({
      doc: doc(p("abcdef")),
      plugins: [decoPlugin(["3-5-foo", "4-6-bar", "1-7-baz"])],
    });
    const baz = view.dom.querySelectorAll(".baz") as unknown as HTMLElement[];
    expect(baz).toHaveLength(5);
    expect(Array.prototype.map.call(baz, (x) => x.textContent).join("-")).toBe(
      "ab-c-d-e-f"
    );
    function classes(n: HTMLElement) {
      return n.className.split(" ").sort().join(" ");
    }
    expect(classes(baz[1]!)).toBe("baz foo");
    expect(classes(baz[2]!)).toBe("bar baz foo");
    expect(classes(baz[3]!)).toBe("bar baz");
  });

  it("draws multiple widgets", () => {
    const { view } = tempEditor({
      doc: doc(p("foobar")),
      plugins: [decoPlugin(["1-widget", "4-widget", "7-widget"])],
    });
    const found = view.dom.querySelectorAll(
      "button"
    ) as unknown as HTMLElement[];
    expect(found).toHaveLength(3);
    expect(found[0]!.nextSibling!.textContent).toBe("foo");
    expect(found[1]!.nextSibling!.textContent).toBe("bar");
    expect(found[2]!.previousSibling!.textContent).toBe("bar");
  });

  it("orders widgets by their side option", () => {
    const { view } = tempEditor({
      doc: doc(p("foobar")),
      plugins: [
        decoPlugin([
          widget(
            4,
            forwardRef(function B(props, ref) {
              return (
                <span ref={ref} {...props}>
                  B
                </span>
              );
            }),
            { key: "widget-b" }
          ),
          widget(
            4,
            forwardRef(function A(props, ref) {
              return (
                <span ref={ref} {...props}>
                  A
                </span>
              );
            }),
            { side: -100, key: "widget-a" }
          ),
          widget(
            4,
            forwardRef(function C(props, ref) {
              return (
                <span ref={ref} {...props}>
                  C
                </span>
              );
            }),
            { side: 2, key: "widget-c" }
          ),
        ]),
      ],
    });
    expect(view.dom.textContent).toBe("fooABCbar");
  });

  it("draws a widget in an empty node", () => {
    const { view } = tempEditor({
      doc: doc(p()),
      plugins: [decoPlugin(["1-widget"])],
    });
    expect(view.dom.querySelectorAll("button")).toHaveLength(1);
  });

  it("draws widgets on node boundaries", () => {
    const { view } = tempEditor({
      doc: doc(p("foo", em("bar"))),
      plugins: [decoPlugin(["4-widget"])],
    });
    expect(view.dom.querySelectorAll("button")).toHaveLength(1);
  });

  it("draws decorations from multiple plugins", () => {
    const { view } = tempEditor({
      doc: doc(p("foo", em("bar"))),
      plugins: [decoPlugin(["2-widget"]), decoPlugin(["6-widget"])],
    });
    expect(view.dom.querySelectorAll("button")).toHaveLength(2);
  });

  it("calls widget destroy methods", () => {
    let destroyed = false;
    const DestroyableWidget = forwardRef<HTMLElement>(
      function DestroyableWidget(props, ref) {
        useEffect(() => {
          destroyed = true;
        });
        return (
          <button ref={ref as LegacyRef<HTMLButtonElement>} {...props}></button>
        );
      }
    );
    const { view } = tempEditor({
      doc: doc(p("abc")),
      plugins: [
        decoPlugin([
          widget(2, DestroyableWidget, { key: "destroyable-widget" }),
        ]),
      ],
    });
    act(() => {
      view.dispatch(view.state.tr.delete(1, 4));
    });
    expect(destroyed).toBeTruthy();
  });

  it("draws inline decorations spanning multiple parents", () => {
    const { view } = tempEditor({
      doc: doc(p("long first ", em("p"), "aragraph"), p("two")),
      plugins: [decoPlugin(["7-25-foo"])],
    });
    const foos = view.dom.querySelectorAll(".foo");
    expect(foos).toHaveLength(4);
    expect(foos[0]!.textContent).toBe("irst ");
    expect(foos[1]!.textContent).toBe("p");
    expect(foos[2]!.textContent).toBe("aragraph");
    expect(foos[3]!.textContent).toBe("tw");
  });

  it("draws inline decorations across empty paragraphs", () => {
    const { view } = tempEditor({
      doc: doc(p("first"), p(), p("second")),
      plugins: [decoPlugin(["3-12-foo"])],
    });
    const foos = view.dom.querySelectorAll(".foo");
    expect(foos).toHaveLength(2);
    expect(foos[0]!.textContent).toBe("rst");
    expect(foos[1]!.textContent).toBe("se");
  });

  it("can handle inline decorations ending at the start or end of a node", () => {
    const { view } = tempEditor({
      doc: doc(p(), p()),
      plugins: [decoPlugin(["1-3-foo"])],
    });
    expect(view.dom.querySelector(".foo")).toBeNull();
  });

  it("can draw decorations with multiple classes", () => {
    const { view } = tempEditor({
      doc: doc(p("foo")),
      plugins: [decoPlugin(["1-4-foo bar"])],
    });
    expect(view.dom.querySelectorAll(".foo")).toHaveLength(1);
    expect(view.dom.querySelectorAll(".bar")).toHaveLength(1);
  });

  it("supports overlapping inline decorations", () => {
    const { view } = tempEditor({
      doc: doc(p("foobar")),
      plugins: [decoPlugin(["1-3-foo", "2-5-bar"])],
    });
    const foos = view.dom.querySelectorAll(".foo");
    const bars = view.dom.querySelectorAll(".bar");
    expect(foos).toHaveLength(2);
    expect(bars).toHaveLength(2);
    expect(foos[0]!.textContent).toBe("f");
    expect(foos[1]!.textContent).toBe("o");
    expect(bars[0]!.textContent).toBe("o");
    expect(bars[1]!.textContent).toBe("ob");
  });

  it("doesn't redraw when irrelevant decorations change", () => {
    const { view } = tempEditor({
      doc: doc(p("foo"), p("baz")),
      plugins: [decoPlugin(["7-8-foo"])],
    });
    const para2 = view.dom.lastChild;
    act(() => {
      updateDeco(view, [make("2-3-bar")]);
    });
    expect(view.dom.lastChild).toBe(para2);
    expect(view.dom.querySelector(".bar")).not.toBeNull();
  });

  it("doesn't redraw when irrelevant content changes", () => {
    const { view } = tempEditor({
      doc: doc(p("foo"), p("baz")),
      plugins: [decoPlugin(["7-8-foo"])],
    });
    const para2 = view.dom.lastChild;
    act(() => {
      view.dispatch(view.state.tr.delete(2, 3));
      view.dispatch(view.state.tr.delete(2, 3));
    });
    expect(view.dom.lastChild).toBe(para2);
  });

  it("can add a widget on a node boundary", () => {
    const { view } = tempEditor({
      doc: doc(p("foo", em("bar"))),
      plugins: [decoPlugin([])],
    });
    act(() => {
      updateDeco(view, [make("4-widget")]);
    });
    expect(view.dom.querySelectorAll("button")).toHaveLength(1);
  });

  it("can remove a widget on a node boundary", () => {
    const dec = make("4-widget");
    const { view } = tempEditor({
      doc: doc(p("foo", em("bar"))),
      plugins: [decoPlugin([dec])],
    });
    act(() => {
      updateDeco(view, null, [dec]);
    });
    expect(view.dom.querySelector("button")).toBeNull();
  });

  it("can remove the class from a text node", () => {
    const dec = make("1-4-foo");
    const { view } = tempEditor({
      doc: doc(p("abc")),
      plugins: [decoPlugin([dec])],
    });
    expect(view.dom.querySelector(".foo")).not.toBeNull();
    act(() => {
      updateDeco(view, null, [dec]);
    });
    expect(view.dom.querySelector(".foo")).toBeNull();
  });

  it("can remove the class from part of a text node", () => {
    const dec = make("2-4-foo");
    const { view } = tempEditor({
      doc: doc(p("abcd")),
      plugins: [decoPlugin([dec])],
    });
    expect(view.dom.querySelector(".foo")).not.toBeNull();
    act(() => {
      updateDeco(view, null, [dec]);
    });
    expect(view.dom.querySelector(".foo")).toBeNull();
    expect((view.dom.firstChild as HTMLElement).innerHTML).toBe("abcd");
  });

  it("can change the class for part of a text node", () => {
    const dec = make("2-4-foo");
    const { view } = tempEditor({
      doc: doc(p("abcd")),
      plugins: [decoPlugin([dec])],
    });
    expect(view.dom.querySelector(".foo")).not.toBeNull();
    act(() => {
      updateDeco(view, [make("2-4-bar")], [dec]);
    });
    expect(view.dom.querySelector(".foo")).toBeNull();
    expect(view.dom.querySelector(".bar")).not.toBeNull();
  });

  it("draws a widget added in the middle of a text node", () => {
    const { view } = tempEditor({
      doc: doc(p("foo")),
      plugins: [decoPlugin([])],
    });
    act(() => {
      updateDeco(view, [make("3-widget")]);
    });
    expect((view.dom.firstChild as HTMLElement).textContent).toBe("foωo");
  });

  it("can update a text node around a widget", () => {
    const { view } = tempEditor({
      doc: doc(p("bar")),
      plugins: [decoPlugin(["3-widget"])],
    });
    act(() => {
      view.dispatch(view.state.tr.delete(1, 2));
    });
    expect(view.dom.querySelectorAll("button")).toHaveLength(1);
    expect((view.dom.firstChild as HTMLElement).textContent).toBe("aωr");
  });

  it("can update a text node with an inline decoration", () => {
    const { view } = tempEditor({
      doc: doc(p("bar")),
      plugins: [decoPlugin(["1-3-foo"])],
    });
    act(() => {
      view.dispatch(view.state.tr.delete(1, 2));
    });
    const foo = view.dom.querySelector(".foo") as HTMLElement;
    expect(foo).not.toBeNull();
    expect(foo.textContent).toBe("a");
    expect(foo.nextSibling!.textContent).toBe("r");
  });

  it("correctly redraws a partially decorated node when a widget is added", () => {
    const { view } = tempEditor({
      doc: doc(p("one", em("two"))),
      plugins: [decoPlugin(["1-6-foo"])],
    });
    act(() => {
      updateDeco(view, [make("6-widget")]);
    });
    const foos = view.dom.querySelectorAll(".foo");
    expect(foos).toHaveLength(2);
    expect(foos[0]!.textContent).toBe("one");
    expect(foos[1]!.textContent).toBe("tw");
  });

  it("correctly redraws when skipping split text node", () => {
    const { view } = tempEditor({
      doc: doc(p("foo")),
      plugins: [decoPlugin(["3-widget", "3-4-foo"])],
    });
    act(() => {
      updateDeco(view, [make("4-widget")]);
    });
    expect(view.dom.querySelectorAll("button")).toHaveLength(2);
  });

  it("drops removed node decorations from the view", () => {
    const deco = Decoration.node(1, 6, { class: "cls" });
    const { view } = tempEditor({
      doc: doc(blockquote(p("foo"), p("bar"))),
      plugins: [decoPlugin([deco])],
    });
    act(() => {
      updateDeco(view, null, [deco]);
    });
    expect(view.dom.querySelector(".cls")).toBeNull();
  });

  it("can update a node's attributes without replacing the node", () => {
    const deco = Decoration.node(0, 5, { title: "title", class: "foo" });
    const { view } = tempEditor({
      doc: doc(p("foo")),
      plugins: [decoPlugin([deco])],
    });
    const para = view.dom.querySelector("p") as HTMLElement;
    act(() => {
      updateDeco(view, [Decoration.node(0, 5, { class: "foo bar" })], [deco]);
    });
    expect(view.dom.querySelector("p")).toBe(para);
    expect(para.className).toBe("foo bar");
    expect(para.title).toBeFalsy();
  });

  it("can add and remove CSS custom properties from a node", () => {
    const deco = Decoration.node(0, 5, { style: "--my-custom-property:36px" });
    const { view } = tempEditor({
      doc: doc(p("foo")),
      plugins: [decoPlugin([deco])],
    });
    expect(
      view.dom
        .querySelector("p")!
        .style.getPropertyValue("--my-custom-property")
    ).toBe("36px");
    act(() => {
      updateDeco(view, null, [deco]);
    });
    expect(
      view.dom
        .querySelector("p")!
        .style.getPropertyValue("--my-custom-property")
    ).toBe("");
  });

  it("updates decorated nodes even if a widget is added before them", () => {
    const { view } = tempEditor({
      doc: doc(p("a"), p("b")),
      plugins: [decoPlugin([])],
    });
    const lastP = view.dom.querySelectorAll("p")[1];
    act(() => {
      updateDeco(view, [
        make("3-widget"),
        Decoration.node(3, 6, { style: "color: red" }),
      ]);
    });
    expect(lastP!.style.color).toBe("red");
  });

  it("doesn't redraw nodes when a widget before them is replaced", () => {
    const w0 = make("3-widget");
    const { view } = tempEditor({
      doc: doc(h1("a"), p("b")),
      plugins: [decoPlugin([w0])],
    });
    const initialP = view.dom.querySelector("p");
    act(() => {
      view.dispatch(
        view.state.tr
          .setMeta("updateDecorations", {
            add: [make("3-widget")],
            remove: [w0],
          })
          .insertText("c", 5)
      );
    });
    expect(view.dom.querySelector("p")).toBe(initialP);
  });

  it("can add and remove inline style", () => {
    const deco = Decoration.inline(1, 6, {
      style: "color: rgba(0,10,200,.4); text-decoration: underline",
    });
    const { view } = tempEditor({
      doc: doc(p("al", img(), "lo")),
      plugins: [decoPlugin([deco])],
    });
    expect(view.dom.querySelector("img")!.style.color).toMatch(/rgba/);
    expect(
      (view.dom.querySelector("img")!.previousSibling as HTMLElement).style
        .textDecoration
    ).toBe("underline");
    act(() => {
      updateDeco(view, null, [deco]);
    });
    expect(view.dom.querySelector("img")!.style.color).toBe("");
    expect(view.dom.querySelector("img")!.style.textDecoration).toBe("");
  });

  it("passes decorations to a node view", () => {
    let current = "";
    const { view } = tempEditor({
      doc: doc(p("foo"), hr()),
      plugins: [decoPlugin([])],
      nodeViews: {
        horizontal_rule: forwardRef(function HR(
          props: NodeViewComponentProps,
          ref
        ) {
          current = props.nodeProps.decorations.map((d) => d.spec.name).join();
          return <hr ref={ref as LegacyRef<HTMLHRElement>} />;
        }),
      },
    });
    const a = Decoration.node(5, 6, {}, { name: "a" });
    act(() => {
      updateDeco(view, [a], []);
    });
    expect(current).toBe("a");
    act(() => {
      updateDeco(
        view,
        [
          Decoration.node(5, 6, {}, { name: "b" }),
          Decoration.node(5, 6, {}, { name: "c" }),
        ],
        [a]
      );
    });
    expect(current).toBe("b,c");
  });

  it("draws the specified marks around a widget", () => {
    const { view } = tempEditor({
      doc: doc(p("foobar")),
      plugins: [
        decoPlugin([
          widget(
            4,
            forwardRef(function Img(props, ref) {
              return (
                <img {...props} ref={ref as LegacyRef<HTMLImageElement>} />
              );
            }),
            {
              marks: [schema.mark("em")],
              key: "img-widget",
            }
          ),
        ]),
      ],
    });
    expect(view.dom.querySelector("em img")).not.toBeNull();
  });

  it("draws widgets inside the marks for their side", () => {
    const { view } = tempEditor({
      doc: doc(p(em("foo"), strong("bar"))),
      plugins: [
        decoPlugin([
          widget(
            4,
            forwardRef(function Img(props, ref) {
              return (
                <img {...props} ref={ref as LegacyRef<HTMLImageElement>} />
              );
            }),
            { side: -1, key: "img-widget" }
          ),
        ]),
        decoPlugin([
          widget(
            4,
            forwardRef(function BR(props, ref) {
              return <br {...props} ref={ref as LegacyRef<HTMLBRElement>} />;
            }),
            { key: "br-widget" }
          ),
        ]),
        decoPlugin([
          widget(
            7,
            forwardRef(function Span(props, ref) {
              return <span {...props} ref={ref} />;
            }),
            { side: 1, key: "span-widget" }
          ),
        ]),
      ],
    });
    expect(view.dom.querySelector("em img")).not.toBeNull();
    expect(view.dom.querySelector("strong img")).toBeNull();
    expect(view.dom.querySelector("strong br")).not.toBeNull();
    expect(view.dom.querySelector("em br")).toBeNull();
    expect(view.dom.querySelector("strong span")).toBeNull();
  });

  it("draws decorations inside node views", () => {
    const { view } = tempEditor({
      doc: doc(p("foo")),
      nodeViews: {
        paragraph: forwardRef(function Paragraph(
          { nodeProps, children, ...props }: NodeViewComponentProps,
          ref
        ) {
          return (
            <p ref={ref as LegacyRef<HTMLParagraphElement>} {...props}>
              {children}
            </p>
          );
        }),
      },
      plugins: [
        decoPlugin([
          widget(
            2,
            forwardRef(function Img(props, ref) {
              return (
                <img {...props} ref={ref as LegacyRef<HTMLImageElement>} />
              );
            }),
            { key: "img-widget" }
          ),
        ]),
      ],
    });
    expect(view.dom.querySelector("img")).not.toBeNull();
  });

  it("can delay widget drawing to render time", () => {
    const { view } = tempEditor({
      doc: doc(p("hi")),
      decorations(state) {
        return DecorationSet.create(state.doc, [
          widget(
            3,
            forwardRef(function Span(props, ref) {
              useEditorEffect((view) => {
                expect(view?.state).toBe(state);
              });
              return (
                <span {...props} ref={ref}>
                  !
                </span>
              );
            }),
            { key: "span-widget" }
          ),
        ]);
      },
    });
    expect(view.dom.textContent).toBe("hi!");
  });

  it("supports widgets querying their own position", () => {
    tempEditor({
      doc: doc(p("hi")),
      decorations(state) {
        return DecorationSet.create(state.doc, [
          widget(
            3,
            forwardRef(function Widget(
              { pos, ...props }: WidgetViewComponentProps,
              ref
            ) {
              expect(pos).toBe(3);
              return (
                <button ref={ref as LegacyRef<HTMLButtonElement>} {...props}>
                  ω
                </button>
              );
            }),
            { key: "button-widget" }
          ),
        ]);
      },
    });
  });

  it("doesn't redraw widgets with matching keys", () => {
    const { view } = tempEditor({
      doc: doc(p("hi")),
      decorations(state) {
        return DecorationSet.create(state.doc, [
          widget(2, Widget, { key: "myButton" }),
        ]);
      },
    });
    const widgetDOM = view.dom.querySelector("button");
    act(() => {
      view.dispatch(view.state.tr.insertText("!", 2, 2));
    });
    expect(view.dom.querySelector("button")).toBe(widgetDOM);
  });

  it("doesn't redraw widgets with identical specs", () => {
    const { view } = tempEditor({
      doc: doc(p("hi")),
      decorations(state) {
        return DecorationSet.create(state.doc, [
          widget(2, Widget, { side: 1, key: "widget" }),
        ]);
      },
    });
    const widgetDOM = view.dom.querySelector("button");
    act(() => {
      view.dispatch(view.state.tr.insertText("!", 2, 2));
    });
    expect(view.dom.querySelector("button")).toBe(widgetDOM);
  });

  it("doesn't get confused by split text nodes", () => {
    const { view } = tempEditor({
      doc: doc(p("abab")),
      decorations(state) {
        return state.selection.from <= 1
          ? null
          : DecorationSet.create(view.state.doc, [
              Decoration.inline(1, 2, { class: "foo" }),
              Decoration.inline(3, 4, { class: "foo" }),
            ]);
      },
    });
    act(() => {
      view.dispatch(
        view.state.tr.setSelection(TextSelection.create(view.state.doc, 5))
      );
    });
    expect(view.dom.textContent).toBe("abab");
  });

  it("only draws inline decorations on the innermost level", () => {
    const s = new Schema({
      nodes: {
        doc: { content: "(text | thing)*" },
        text: {},
        thing: {
          inline: true,
          content: "text*",
          toDOM: () => ["strong", 0],
          parseDOM: [{ tag: "strong" }],
        },
      },
    });
    const { view } = tempEditor({
      doc: s.node("doc", null, [
        s.text("abc"),
        s.node("thing", null, [s.text("def")]),
        s.text("ghi"),
      ]) as ReturnType<typeof doc>,
      decorations: (s) =>
        DecorationSet.create(s.doc, [
          Decoration.inline(1, 10, { class: "dec" }),
        ]),
    });
    const styled = view.dom.querySelectorAll(".dec");
    expect(styled).toHaveLength(3);
    expect(Array.prototype.map.call(styled, (n) => n.textContent).join()).toBe(
      "bc,def,gh"
    );
    expect(styled[1]!.parentNode!.nodeName).toBe("STRONG");
  });

  it("can handle nodeName decoration overlapping with classes", () => {
    const { view } = tempEditor({
      doc: doc(p("one two three")),
      plugins: [
        decoPlugin([
          Decoration.inline(2, 13, { class: "foo" }),
          Decoration.inline(5, 8, { nodeName: "em" }),
        ]),
      ],
    });
    expect((view.dom.firstChild as HTMLElement).innerHTML).toBe(
      'o<span class="foo">ne </span><em class="foo">two</em><span class="foo"> thre</span>e'
    );
  });

  it("can handle combining decorations from parent editors in child editors", () => {
    let decosFromFirstEditor: DecorationSource | undefined;
    let { view } = tempEditor({
      doc: doc(p("one two three")),
      plugins: [
        decoPlugin([Decoration.inline(2, 13, { class: "foo" })]),
        decoPlugin([Decoration.inline(2, 13, { class: "bar" })]),
      ],
      nodeViews: {
        paragraph: forwardRef(function Paragraph(
          { nodeProps, children, ...props }: NodeViewComponentProps,
          ref
        ) {
          decosFromFirstEditor = nodeProps.innerDecorations;
          return (
            <p ref={ref as LegacyRef<HTMLParagraphElement>} {...props}>
              {children}
            </p>
          );
        }),
      },
    });

    ({ view } = tempEditor({
      doc: doc(p("one two three")),
      plugins: [decoPlugin([Decoration.inline(1, 12, { class: "baz" })])],
      decorations: () => decosFromFirstEditor,
    }));

    expect(view.dom.querySelectorAll(".foo")).toHaveLength(1);
    expect(view.dom.querySelectorAll(".bar")).toHaveLength(1);
    expect(view.dom.querySelectorAll(".baz")).toHaveLength(1);
  });
});
