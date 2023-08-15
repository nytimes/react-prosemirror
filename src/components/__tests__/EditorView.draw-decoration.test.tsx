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
import React, { RefAttributes, forwardRef } from "react";

import { widget } from "../../decorations/ReactWidgetType.js";
import {
  Decoration,
  DecorationSet,
  DecorationSource,
  EditorView,
} from "../../prosemirror-view/index.js";
import { tempEditor } from "../../testing/editorViewTestHelpers.js";

const Widget = forwardRef<HTMLElement>(function Widget(props, ref) {
  return (
    // @ts-expect-error I genuinely never know what to do about these ref mismatches
    <button ref={ref} {...props}>
      ω
    </button>
  );
});

function make(str: string | Decoration): Decoration {
  if (typeof str != "string") return str;
  const match = /^(\d+)(?:-(\d+))?-(.+)$/.exec(str)!;
  if (match[3] == "widget") {
    return widget(+match[1]!, Widget);
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
    const view = tempEditor({
      doc: doc(p("foobar")),
      plugins: [decoPlugin(["2-5-foo"])],
    });
    const found = view.dom.querySelector(".foo")!;
    expect(found).not.toBeNull();
    expect(found.textContent).toBe("oob");
  });

  it("draws wrapping decorations", () => {
    const view = tempEditor({
      doc: doc(p("foo")),
      plugins: [decoPlugin([Decoration.inline(1, 5, { nodeName: "i" })])],
    });
    const found = view.dom.querySelector("i");
    expect(found && found.innerHTML).toBe("foo");
  });

  it("draws node decorations", () => {
    const view = tempEditor({
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
    const view = tempEditor({
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
    const view = tempEditor({
      doc: doc(p("abcdef")),
      plugins: [decoPlugin(["3-5-foo", "4-6-bar", "1-7-baz"])],
    });
    const baz = view.dom.querySelectorAll(".baz") as any as HTMLElement[];
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
    const view = tempEditor({
      doc: doc(p("foobar")),
      plugins: [decoPlugin(["1-widget", "4-widget", "7-widget"])],
    });
    const found = view.dom.querySelectorAll("button") as any as HTMLElement[];
    expect(found).toHaveLength(3);
    expect(found[0]!.nextSibling!.textContent).toBe("foo");
    expect(found[1]!.nextSibling!.textContent).toBe("bar");
    expect(found[2]!.previousSibling!.textContent).toBe("bar");
  });

  it("orders widgets by their side option", () => {
    const view = tempEditor({
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
            })
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
            { side: -100 }
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
            { side: 2 }
          ),
        ]),
      ],
    });
    expect(view.dom.textContent).toBe("fooABCbar");
  });

  // it("draws a widget in an empty node", () => {
  //   const view = tempEditor({
  //     doc: doc(p()),
  //     plugins: [decoPlugin(["1-widget"])],
  //   });
  //   expect(view.dom.querySelectorAll("button").length, 1);
  // });

  // it("draws widgets on node boundaries", () => {
  //   const view = tempEditor({
  //     doc: doc(p("foo", em("bar"))),
  //     plugins: [decoPlugin(["4-widget"])],
  //   });
  //   expect(view.dom.querySelectorAll("button").length, 1);
  // });

  // it("draws decorations from multiple plugins", () => {
  //   const view = tempEditor({
  //     doc: doc(p("foo", em("bar"))),
  //     plugins: [decoPlugin(["2-widget"]), decoPlugin(["6-widget"])],
  //   });
  //   expect(view.dom.querySelectorAll("button").length, 2);
  // });

  // it("calls widget destroy methods", () => {
  //   let destroyed = false;
  //   const view = tempEditor({
  //     doc: doc(p("abc")),
  //     plugins: [
  //       decoPlugin([
  //         Decoration.widget(2, document.createElement("BUTTON"), {
  //           destroy: (node) => {
  //             destroyed = true;
  //             expect((node as HTMLElement).tagName, "BUTTON");
  //           },
  //         }),
  //       ]),
  //     ],
  //   });
  //   view.dispatch(view.state.tr.delete(1, 4));
  //   expect(destroyed);
  // });

  // it("draws inline decorations spanning multiple parents", () => {
  //   const view = tempEditor({
  //     doc: doc(p("long first ", em("p"), "aragraph"), p("two")),
  //     plugins: [decoPlugin(["7-25-foo"])],
  //   });
  //   const foos = view.dom.querySelectorAll(".foo");
  //   expect(foos.length, 4);
  //   expect(foos[0].textContent, "irst ");
  //   expect(foos[1].textContent, "p");
  //   expect(foos[2].textContent, "aragraph");
  //   expect(foos[3].textContent, "tw");
  // });

  // it("draws inline decorations across empty paragraphs", () => {
  //   const view = tempEditor({
  //     doc: doc(p("first"), p(), p("second")),
  //     plugins: [decoPlugin(["3-12-foo"])],
  //   });
  //   const foos = view.dom.querySelectorAll(".foo");
  //   expect(foos.length, 2);
  //   expect(foos[0].textContent, "rst");
  //   expect(foos[1].textContent, "se");
  // });

  // it("can handle inline decorations ending at the start or end of a node", () => {
  //   const view = tempEditor({
  //     doc: doc(p(), p()),
  //     plugins: [decoPlugin(["1-3-foo"])],
  //   });
  //   expect(!view.dom.querySelector(".foo"));
  // });

  // it("can draw decorations with multiple classes", () => {
  //   const view = tempEditor({
  //     doc: doc(p("foo")),
  //     plugins: [decoPlugin(["1-4-foo bar"])],
  //   });
  //   expect(view.dom.querySelectorAll(".foo").length, 1);
  //   expect(view.dom.querySelectorAll(".bar").length, 1);
  // });

  // it("supports overlapping inline decorations", () => {
  //   const view = tempEditor({
  //     doc: doc(p("foobar")),
  //     plugins: [decoPlugin(["1-3-foo", "2-5-bar"])],
  //   });
  //   const foos = view.dom.querySelectorAll(".foo");
  //   const bars = view.dom.querySelectorAll(".bar");
  //   expect(foos.length, 2);
  //   expect(bars.length, 2);
  //   expect(foos[0].textContent, "f");
  //   expect(foos[1].textContent, "o");
  //   expect(bars[0].textContent, "o");
  //   expect(bars[1].textContent, "ob");
  // });

  // it("doesn't redraw when irrelevant decorations change", () => {
  //   const view = tempEditor({
  //     doc: doc(p("foo"), p("baz")),
  //     plugins: [decoPlugin(["7-8-foo"])],
  //   });
  //   const para2 = view.dom.lastChild;
  //   updateDeco(view, [make("2-3-bar")]);
  //   expect(view.dom.lastChild, para2);
  //   expect(view.dom.querySelector(".bar"));
  // });

  // it("doesn't redraw when irrelevant content changes", () => {
  //   const view = tempEditor({
  //     doc: doc(p("foo"), p("baz")),
  //     plugins: [decoPlugin(["7-8-foo"])],
  //   });
  //   const para2 = view.dom.lastChild;
  //   view.dispatch(view.state.tr.delete(2, 3));
  //   view.dispatch(view.state.tr.delete(2, 3));
  //   expect(view.dom.lastChild, para2);
  // });

  // it("can add a widget on a node boundary", () => {
  //   const view = tempEditor({
  //     doc: doc(p("foo", em("bar"))),
  //     plugins: [decoPlugin([])],
  //   });
  //   updateDeco(view, [make("4-widget")]);
  //   expect(view.dom.querySelectorAll("button").length, 1);
  // });

  // it("can remove a widget on a node boundary", () => {
  //   const dec = make("4-widget");
  //   const view = tempEditor({
  //     doc: doc(p("foo", em("bar"))),
  //     plugins: [decoPlugin([dec])],
  //   });
  //   updateDeco(view, null, [dec]);
  //   expect(view.dom.querySelector("button"), null);
  // });

  // it("can remove the class from a text node", () => {
  //   const dec = make("1-4-foo");
  //   const view = tempEditor({
  //     doc: doc(p("abc")),
  //     plugins: [decoPlugin([dec])],
  //   });
  //   expect(view.dom.querySelector(".foo"));
  //   updateDeco(view, null, [dec]);
  //   expect(view.dom.querySelector(".foo"), null);
  // });

  // it("can remove the class from part of a text node", () => {
  //   const dec = make("2-4-foo");
  //   const view = tempEditor({
  //     doc: doc(p("abcd")),
  //     plugins: [decoPlugin([dec])],
  //   });
  //   expect(view.dom.querySelector(".foo"));
  //   updateDeco(view, null, [dec]);
  //   expect(view.dom.querySelector(".foo"), null);
  //   expect((view.dom.firstChild as HTMLElement).innerHTML, "abcd");
  // });

  // it("can remove the class for part of a text node", () => {
  //   const dec = make("2-4-foo");
  //   const view = tempEditor({
  //     doc: doc(p("abcd")),
  //     plugins: [decoPlugin([dec])],
  //   });
  //   expect(view.dom.querySelector(".foo"));
  //   updateDeco(view, [make("2-4-bar")], [dec]);
  //   expect(view.dom.querySelector(".foo"), null);
  //   expect(view.dom.querySelector(".bar"));
  // });

  // it("draws a widget added in the middle of a text node", () => {
  //   const view = tempEditor({ doc: doc(p("foo")), plugins: [decoPlugin([])] });
  //   updateDeco(view, [make("3-widget")]);
  //   expect((view.dom.firstChild as HTMLElement).textContent, "foωo");
  // });

  // it("can update a text node around a widget", () => {
  //   const view = tempEditor({
  //     doc: doc(p("bar")),
  //     plugins: [decoPlugin(["3-widget"])],
  //   });
  //   view.dispatch(view.state.tr.delete(1, 2));
  //   expect(view.dom.querySelectorAll("button").length, 1);
  //   expect((view.dom.firstChild as HTMLElement).textContent, "aωr");
  // });

  // it("can update a text node with an inline decoration", () => {
  //   const view = tempEditor({
  //     doc: doc(p("bar")),
  //     plugins: [decoPlugin(["1-3-foo"])],
  //   });
  //   view.dispatch(view.state.tr.delete(1, 2));
  //   const foo = view.dom.querySelector(".foo") as HTMLElement;
  //   expect(foo);
  //   expect(foo.textContent, "a");
  //   expect(foo.nextSibling!.textContent, "r");
  // });

  // it("correctly redraws a partially decorated node when a widget is added", () => {
  //   const view = tempEditor({
  //     doc: doc(p("one", em("two"))),
  //     plugins: [decoPlugin(["1-6-foo"])],
  //   });
  //   updateDeco(view, [make("6-widget")]);
  //   const foos = view.dom.querySelectorAll(".foo");
  //   expect(foos.length, 2);
  //   expect(foos[0].textContent, "one");
  //   expect(foos[1].textContent, "tw");
  // });

  // it("correctly redraws when skipping split text node", () => {
  //   const view = tempEditor({
  //     doc: doc(p("foo")),
  //     plugins: [decoPlugin(["3-widget", "3-4-foo"])],
  //   });
  //   updateDeco(view, [make("4-widget")]);
  //   expect(view.dom.querySelectorAll("button").length, 2);
  // });

  // it("drops removed node decorations from the view", () => {
  //   const deco = Decoration.node(1, 6, { class: "cls" });
  //   const view = tempEditor({
  //     doc: doc(blockquote(p("foo"), p("bar"))),
  //     plugins: [decoPlugin([deco])],
  //   });
  //   updateDeco(view, null, [deco]);
  //   expect(!view.dom.querySelector(".cls"));
  // });

  // it("can update a node's attributes without replacing the node", () => {
  //   const deco = Decoration.node(0, 5, { title: "title", class: "foo" });
  //   const view = tempEditor({
  //     doc: doc(p("foo")),
  //     plugins: [decoPlugin([deco])],
  //   });
  //   const para = view.dom.querySelector("p") as HTMLElement;
  //   updateDeco(view, [Decoration.node(0, 5, { class: "foo bar" })], [deco]);
  //   expect(view.dom.querySelector("p"), para);
  //   expect(para.className, "foo bar");
  //   expect(!para.title);
  // });

  // it("can add and remove CSS custom properties from a node", () => {
  //   const deco = Decoration.node(0, 5, { style: "--my-custom-property:36px" });
  //   const view = tempEditor({
  //     doc: doc(p("foo")),
  //     plugins: [decoPlugin([deco])],
  //   });
  //   expect(
  //     view.dom
  //       .querySelector("p")!
  //       .style.getPropertyValue("--my-custom-property"),
  //     "36px"
  //   );
  //   updateDeco(view, null, [deco]);
  //   expect(
  //     view.dom
  //       .querySelector("p")!
  //       .style.getPropertyValue("--my-custom-property"),
  //     ""
  //   );
  // });

  // it("updates decorated nodes even if a widget is added before them", () => {
  //   const view = tempEditor({
  //     doc: doc(p("a"), p("b")),
  //     plugins: [decoPlugin([])],
  //   });
  //   const lastP = view.dom.querySelectorAll("p")[1];
  //   updateDeco(view, [
  //     make("3-widget"),
  //     Decoration.node(3, 6, { style: "color: red" }),
  //   ]);
  //   expect(lastP.style.color, "red");
  // });

  // it("doesn't redraw nodes when a widget before them is replaced", () => {
  //   const w0 = make("3-widget");
  //   const view = tempEditor({
  //     doc: doc(h1("a"), p("b")),
  //     plugins: [decoPlugin([w0])],
  //   });
  //   const initialP = view.dom.querySelector("p");
  //   view.dispatch(
  //     view.state.tr
  //       .setMeta("updateDecorations", { add: [make("3-widget")], remove: [w0] })
  //       .insertText("c", 5)
  //   );
  //   expect(view.dom.querySelector("p"), initialP);
  // });

  // it("can add and remove inline style", () => {
  //   const deco = Decoration.inline(1, 6, {
  //     style: "color: rgba(0,10,200,.4); text-decoration: underline",
  //   });
  //   const view = tempEditor({
  //     doc: doc(p("al", img(), "lo")),
  //     plugins: [decoPlugin([deco])],
  //   });
  //   expect(/rgba/.test(view.dom.querySelector("img")!.style.color));
  //   expect(
  //     (view.dom.querySelector("img")!.previousSibling as HTMLElement).style
  //       .textDecoration,
  //     "underline"
  //   );
  //   updateDeco(view, null, [deco]);
  //   expect(view.dom.querySelector("img")!.style.color, "");
  //   expect(view.dom.querySelector("img")!.style.textDecoration, "");
  // });

  // it("passes decorations to a node view", () => {
  //   let current = "";
  //   const view = tempEditor({
  //     doc: doc(p("foo"), hr()),
  //     plugins: [decoPlugin([])],
  //     nodeViews: {
  //       horizontal_rule: () => ({
  //         dom: document.createElement("hr"),
  //         update(_, decos) {
  //           current = decos.map((d) => d.spec.name).join();
  //           return false;
  //         },
  //       }),
  //     },
  //   });
  //   const a = Decoration.node(5, 6, {}, { name: "a" });
  //   updateDeco(view, [a], []);
  //   expect(current, "a");
  //   updateDeco(
  //     view,
  //     [
  //       Decoration.node(5, 6, {}, { name: "b" }),
  //       Decoration.node(5, 6, {}, { name: "c" }),
  //     ],
  //     [a]
  //   );
  //   expect(current, "b,c");
  // });

  // it("draws the specified marks around a widget", () => {
  //   const view = tempEditor({
  //     doc: doc(p("foobar")),
  //     plugins: [
  //       decoPlugin([
  //         Decoration.widget(4, document.createElement("img"), {
  //           marks: [schema.mark("em")],
  //         }),
  //       ]),
  //     ],
  //   });
  //   expect(view.dom.querySelector("em img"));
  // });

  // it("draws widgets inside the marks for their side", () => {
  //   const view = tempEditor({
  //     doc: doc(p(em("foo"), strong("bar"))),
  //     plugins: [
  //       decoPlugin([
  //         Decoration.widget(4, document.createElement("img"), { side: -1 }),
  //       ]),
  //       decoPlugin([Decoration.widget(4, document.createElement("br"))]),
  //       decoPlugin([
  //         Decoration.widget(7, document.createElement("span"), { side: 1 }),
  //       ]),
  //     ],
  //   });
  //   expect(view.dom.querySelector("em img"));
  //   expect(!view.dom.querySelector("strong img"));
  //   expect(view.dom.querySelector("strong br"));
  //   expect(!view.dom.querySelector("em br"));
  //   expect(!view.dom.querySelector("strong span"));
  // });

  // it("draws decorations inside node views", () => {
  //   const view = tempEditor({
  //     doc: doc(p("foo")),
  //     nodeViews: {
  //       paragraph() {
  //         const p = document.createElement("p");
  //         return { dom: p, contentDOM: p };
  //       },
  //     },
  //     plugins: [
  //       decoPlugin([Decoration.widget(2, document.createElement("img"))]),
  //     ],
  //   });
  //   expect(view.dom.querySelector("img"));
  // });

  // it("can delay widget drawing to render time", () => {
  //   const view = tempEditor({
  //     doc: doc(p("hi")),
  //     decorations(state) {
  //       return DecorationSet.create(state.doc, [
  //         Decoration.widget(3, (view) => {
  //           expect(view.state, state);
  //           const elt = document.createElement("span");
  //           elt.textContent = "!";
  //           return elt;
  //         }),
  //       ]);
  //     },
  //   });
  //   expect(view.dom.textContent, "hi!");
  // });

  // it("supports widgets querying their own position", () => {
  //   let get: () => number | undefined;
  //   tempEditor({
  //     doc: doc(p("hi")),
  //     decorations(state) {
  //       return DecorationSet.create(state.doc, [
  //         Decoration.widget(3, (_view, getPos) => {
  //           expect(getPos(), 3);
  //           get = getPos;
  //           return document.createElement("button");
  //         }),
  //       ]);
  //     },
  //   });
  //   expect(get!(), 3);
  // });

  // it("doesn't redraw widgets with matching keys", () => {
  //   const mkButton = () => document.createElement("button");
  //   const view = tempEditor({
  //     doc: doc(p("hi")),
  //     decorations(state) {
  //       return DecorationSet.create(state.doc, [
  //         Decoration.widget(2, mkButton, { key: "myButton" }),
  //       ]);
  //     },
  //   });
  //   const widgetDOM = view.dom.querySelector("button");
  //   view.dispatch(view.state.tr.insertText("!", 2, 2));
  //   expect(view.dom.querySelector("button"), widgetDOM);
  // });

  // it("doesn't redraw widgets with identical specs", () => {
  //   const toDOM = () => document.createElement("button");
  //   const view = tempEditor({
  //     doc: doc(p("hi")),
  //     decorations(state) {
  //       return DecorationSet.create(state.doc, [
  //         Decoration.widget(2, toDOM, { side: 1 }),
  //       ]);
  //     },
  //   });
  //   const widgetDOM = view.dom.querySelector("button");
  //   view.dispatch(view.state.tr.insertText("!", 2, 2));
  //   expect(view.dom.querySelector("button"), widgetDOM);
  // });

  // it("doesn't get confused by split text nodes", () => {
  //   const view = tempEditor({
  //     doc: doc(p("abab")),
  //     decorations(state) {
  //       return state.selection.from <= 1
  //         ? null
  //         : DecorationSet.create(view.state.doc, [
  //             Decoration.inline(1, 2, { class: "foo" }),
  //             Decoration.inline(3, 4, { class: "foo" }),
  //           ]);
  //     },
  //   });
  //   view.dispatch(
  //     view.state.tr.setSelection(TextSelection.create(view.state.doc, 5))
  //   );
  //   expect(view.dom.textContent, "abab");
  // });

  // it("only draws inline decorations on the innermost level", () => {
  //   const s = new Schema({
  //     nodes: {
  //       doc: { content: "(text | thing)*" },
  //       text: {},
  //       thing: {
  //         inline: true,
  //         content: "text*",
  //         toDOM: () => ["strong", 0],
  //         parseDOM: [{ tag: "strong" }],
  //       },
  //     },
  //   });
  //   const view = tempEditor({
  //     doc: s.node("doc", null, [
  //       s.text("abc"),
  //       s.node("thing", null, [s.text("def")]),
  //       s.text("ghi"),
  //     ]),
  //     decorations: (s) =>
  //       DecorationSet.create(s.doc, [
  //         Decoration.inline(1, 10, { class: "dec" }),
  //       ]),
  //   });
  //   const styled = view.dom.querySelectorAll(".dec");
  //   expect(styled.length, 3);
  //   expect(
  //     Array.prototype.map.call(styled, (n) => n.textContent).join(),
  //     "bc,def,gh"
  //   );
  //   expect(styled[1].parentNode!.nodeName, "STRONG");
  // });

  // it("can handle nodeName decoration overlapping with classes", () => {
  //   const view = tempEditor({
  //     doc: doc(p("one two three")),
  //     plugins: [
  //       decoPlugin([
  //         Decoration.inline(2, 13, { class: "foo" }),
  //         Decoration.inline(5, 8, { nodeName: "em" }),
  //       ]),
  //     ],
  //   });
  //   expect(
  //     (view.dom.firstChild as HTMLElement).innerHTML,
  //     'o<span class="foo">ne </span><em class="foo">two</em><span class="foo"> thre</span>e'
  //   );
  // });

  // it("can handle combining decorations from parent editors in child editors", () => {
  //   let decosFromFirstEditor: DecorationSource | undefined;
  //   let view = tempEditor({
  //     doc: doc(p("one two three")),
  //     plugins: [
  //       decoPlugin([Decoration.inline(2, 13, { class: "foo" })]),
  //       decoPlugin([Decoration.inline(2, 13, { class: "bar" })]),
  //     ],
  //     nodeViews: {
  //       paragraph: (_node, _view, _getPos, _decos, innerDecos) => {
  //         decosFromFirstEditor = innerDecos;
  //         return { dom: document.createElement("p") };
  //       },
  //     },
  //   });

  //   view = tempEditor({
  //     doc: doc(p("one two three")),
  //     plugins: [decoPlugin([Decoration.inline(1, 12, { class: "baz" })])],
  //     decorations: () => decosFromFirstEditor,
  //   });

  //   expect(view.dom.querySelectorAll(".foo").length, 1);
  //   expect(view.dom.querySelectorAll(".bar").length, 1);
  //   expect(view.dom.querySelectorAll(".baz").length, 1);
  // });
});
