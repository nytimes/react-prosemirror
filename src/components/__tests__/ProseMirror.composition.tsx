/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect } from "@jest/globals";
import { act } from "@testing-library/react";
import { doc, em, p, strong } from "prosemirror-test-builder";

import { EditorView, __endComposition } from "../../prosemirror-view/index.js";
import {
  findTextNode,
  tempEditor,
} from "../../testing/editorViewTestHelpers.js";
import { setupProseMirrorView } from "../../testing/setupProseMirrorView.js";

function endComposition(view: EditorView, forceUpdate?: boolean) {
  act(() => {
    __endComposition(view, forceUpdate);
  });
}

function event(pm: EditorView, type: string) {
  act(() => {
    pm.dom.dispatchEvent(new CompositionEvent(type));
  });
}

function edit(node: Text, text = "", from = node.nodeValue!.length, to = from) {
  const val = node.nodeValue!;
  node.nodeValue = val.slice(0, from) + text + val.slice(to);
  document.getSelection()!.collapse(node, from + text.length);
  return node;
}

function hasCompositionNode(_pm: EditorView) {
  let { focusNode } = document.getSelection()!;
  while (focusNode && !focusNode.pmViewDesc) focusNode = focusNode.parentNode;
  return (
    focusNode && focusNode.pmViewDesc!.constructor.name == "CompositionViewDesc"
  );
}

function compose(
  pm: EditorView,
  start: () => Text,
  update: ((node: Text) => void)[],
  options: any = {}
) {
  event(pm, "compositionstart");
  expect(pm.composing).toBeTruthy();
  let node: Text;
  const sel = document.getSelection()!;
  for (let i = -1; i < update.length; i++) {
    if (i < 0) node = start();
    else update[i]!(node!);
    const { focusNode, focusOffset } = sel;
    act(() => {
      pm.domObserver.flush();
    });

    if (options.cancel && i == update.length - 1) {
      expect(hasCompositionNode(pm)).toBeFalsy();
    } else {
      expect(
        node!.parentNode! && pm.dom.contains(node!.parentNode!)
      ).toBeTruthy();
      expect(sel.focusNode).toBe(focusNode);
      expect(sel.focusOffset).toBe(focusOffset);
      if (options.node) expect(hasCompositionNode(pm)).toBeTruthy();
    }
  }
  event(pm, "compositionend");
  if (options.end) {
    options.end(node!);
    pm.domObserver.flush();
  }
  endComposition(pm);
  expect(pm.composing).toBeFalsy();
  expect(hasCompositionNode(pm)).toBeFalsy();
}

// function wordDeco(state: EditorState) {
//   const re = /\w+/g,
//     deco: Decoration[] = [];
//   state.doc.descendants((node, pos) => {
//     if (node.isText)
//       for (let m; (m = re.exec(node.text!)); )
//         deco.push(
//           Decoration.inline(pos + m.index, pos + m.index + m[0].length, {
//             class: "word",
//           })
//         );
//   });
//   return DecorationSet.create(state.doc, deco);
// }

// const wordHighlighter = new Plugin({
//   props: { decorations: wordDeco },
// });

// const Widget = forwardRef(function Widget(
//   { widget, pos, ...props }: WidgetViewComponentProps,
//   ref: Ref<HTMLElement>
// ) {
//   return (
//     <var ref={ref} {...props}>
//       ×
//     </var>
//   );
// });

// function widgets(positions: number[], sides: number[]) {
//   return new Plugin({
//     state: {
//       init(state) {
//         const deco = positions.map((p, i) =>
//           widget(p, Widget, { side: sides[i] })
//         );
//         return DecorationSet.create(state.doc!, deco);
//       },
//       apply(tr, deco) {
//         return deco.map(tr.mapping, tr.doc);
//       },
//     },
//     props: {
//       decorations(this: Plugin, state) {
//         return this.getState(state);
//       },
//     },
//   });
// }

describe("EditorView composition", () => {
  beforeAll(() => {
    setupProseMirrorView();
  });

  it("supports composition in an empty block", () => {
    const { view: pm } = tempEditor({ doc: doc(p("<a>")) });
    compose(
      pm,
      () => edit(pm.dom.firstChild!.appendChild(document.createTextNode("a"))),
      [(n) => edit(n, "b"), (n) => edit(n, "c")],
      { node: true }
    );
    expect(pm.state.doc).toEqualNode(doc(p("abc")));
  });

  it("supports composition at end of block", () => {
    const { view: pm } = tempEditor({ doc: doc(p("foo")) });
    compose(pm, () => edit(findTextNode(pm.dom, "foo")!), [
      (n) => edit(n, "!"),
      (n) => edit(n, "?"),
    ]);
    expect(pm.state.doc).toEqualNode(doc(p("foo!?")));
  });

  it("supports composition at end of block in a new node", () => {
    const { view: pm } = tempEditor({ doc: doc(p("foo")) });
    compose(
      pm,
      () => edit(pm.dom.firstChild!.appendChild(document.createTextNode("!"))),
      [(n) => edit(n, "?")],
      // $$FORK: We don't use composition view descriptors except for in initially empty nodes
      { node: false }
    );
    expect(pm.state.doc).toEqualNode(doc(p("foo!?")));
  });

  it("supports composition at start of block in a new node", () => {
    const { view: pm } = tempEditor({ doc: doc(p("foo")) });
    compose(
      pm,
      () => {
        const p = pm.dom.firstChild!;
        return edit(p.insertBefore(document.createTextNode("!"), p.firstChild));
      },
      [(n) => edit(n, "?")],
      // $$FORK: We don't use composition view descriptors except for in initially empty nodes
      { node: false }
    );
    expect(pm.state.doc).toEqualNode(doc(p("!?foo")));
  });

  it("supports composition inside existing text", () => {
    const { view: pm } = tempEditor({ doc: doc(p("foo")) });
    compose(pm, () => edit(findTextNode(pm.dom, "foo")!), [
      (n) => edit(n, "x", 1),
      (n) => edit(n, "y", 2),
      (n) => edit(n, "z", 3),
    ]);
    expect(pm.state.doc).toEqualNode(doc(p("fxyzoo")));
  });

  // TODO: Offset out of bound
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip("can deal with Android-style newline-after-composition", () => {
    const { view: pm } = tempEditor({ doc: doc(p("abcdef")) });
    compose(
      pm,
      () => edit(findTextNode(pm.dom, "abcdef")!),
      [(n) => edit(n, "x", 3), (n) => edit(n, "y", 4)],
      {
        end: (n: Text) => {
          const line = pm.dom.appendChild(document.createElement("div"));
          line.textContent = "def";
          n.nodeValue = "abcxy";
          document.getSelection()!.collapse(line, 0);
        },
      }
    );
    expect(pm.state.doc).toEqualNode(doc(p("abcxy"), p("def")));
  });

  it("handles replacement of existing words", () => {
    const { view: pm } = tempEditor({ doc: doc(p("one two three")) });
    compose(
      pm,
      () => edit(findTextNode(pm.dom, "one two three")!, "five", 4, 7),
      [(n) => edit(n, "seven", 4, 8), (n) => edit(n, "zero", 4, 9)]
    );
    expect(pm.state.doc).toEqualNode(doc(p("one zero three")));
  });

  it("handles composition inside marks", () => {
    const { view: pm } = tempEditor({ doc: doc(p("one ", em("two"))) });
    compose(pm, () => edit(findTextNode(pm.dom, "two")!, "o"), [
      (n) => edit(n, "o"),
      (n) => edit(n, "w"),
    ]);
    expect(pm.state.doc).toEqualNode(doc(p("one ", em("twooow"))));
  });

  it.skip("handles composition in a mark that has multiple children", () => {
    const { view: pm } = tempEditor({
      doc: doc(p("one ", em("two", strong(" three")))),
    });
    compose(pm, () => edit(findTextNode(pm.dom, "two")!, "o"), [
      (n) => edit(n, "o"),
      (n) => edit(n, "w"),
    ]);
    expect(pm.state.doc).toEqualNode(
      doc(p("one ", em("twooow", strong(" three"))))
    );
  });

  // it("supports composition in a cursor wrapper", () => {
  //   const { view: pm } = tempEditor({ doc: doc(p("<a>")) });
  //   pm.dispatch(pm.state.tr.addStoredMark(schema.marks.em.create()));
  //   compose(
  //     pm,
  //     () =>
  //       edit(pm.dom.firstChild!.appendChild(document.createTextNode("")), "a"),
  //     [(n) => edit(n, "b"), (n) => edit(n, "c")],
  //     { node: true }
  //   );
  //   ist(pm.state.doc, doc(p(em("abc"))), eq);
  // });

  // it("handles composition in a multi-child mark with a cursor wrapper", () => {
  //   const { view: pm } = requireFocus(
  //     tempEditor({ doc: doc(p("one ", em("two<a>", strong(" three")))) })
  //   );
  //   pm.dispatch(pm.state.tr.addStoredMark(schema.marks.code.create()));
  //   const emNode = pm.dom.querySelector("em")!;
  //   compose(
  //     pm,
  //     () =>
  //       edit(
  //         emNode.insertBefore(
  //           document.createTextNode(""),
  //           emNode.querySelector("strong")
  //         ),
  //         "o"
  //       ),
  //     [(n) => edit(n, "o"), (n) => edit(n, "w")],
  //     { node: true }
  //   );
  //   ist(
  //     pm.state.doc,
  //     doc(p("one ", em("two", code("oow"), strong(" three")))),
  //     eq
  //   );
  // });

  // it("doesn't get interrupted by changes in decorations", () => {
  //   const { view: pm } = requireFocus(
  //     tempEditor({ doc: doc(p("foo ...")), plugins: [wordHighlighter] })
  //   );
  //   compose(pm, () => edit(findTextNode(pm.dom, " ...")!), [
  //     (n) => edit(n, "hi", 1, 4),
  //   ]);
  //   ist(pm.state.doc, doc(p("foo hi")), eq);
  // });

  // it("works inside highlighted text", () => {
  //   const { view: pm } = requireFocus(
  //     tempEditor({ doc: doc(p("one two")), plugins: [wordHighlighter] })
  //   );
  //   compose(pm, () => edit(findTextNode(pm.dom, "one")!, "x"), [
  //     (n) => edit(n, "y"),
  //     (n) => edit(n, "."),
  //   ]);
  //   ist(pm.state.doc, doc(p("onexy. two")), eq);
  // });

  // it("can handle compositions spanning multiple nodes", () => {
  //   const { view: pm } = requireFocus(
  //     tempEditor({ doc: doc(p("one two")), plugins: [wordHighlighter] })
  //   );
  //   compose(
  //     pm,
  //     () => edit(findTextNode(pm.dom, "two")!, "a"),
  //     [(n) => edit(n, "b"), (n) => edit(n, "c")],
  //     {
  //       end: (n: Text) => {
  //         n.parentNode!.previousSibling!.remove();
  //         n.parentNode!.previousSibling!.remove();
  //         return edit(n, "xyzone ", 0);
  //       },
  //     }
  //   );
  //   ist(pm.state.doc, doc(p("xyzone twoabc")), eq);
  // });

  // it("doesn't overwrite widgets next to the composition", () => {
  //   const { view: pm } = requireFocus(
  //     tempEditor({ doc: doc(p("")), plugins: [widgets([1, 1], [-1, 1])] })
  //   );
  //   compose(
  //     pm,
  //     () => {
  //       const p = pm.dom.firstChild!;
  //       return edit(p.insertBefore(document.createTextNode("a"), p.lastChild));
  //     },
  //     [(n) => edit(n, "b", 0, 1)],
  //     {
  //       end: () => {
  //         ist(pm.dom.querySelectorAll("var").length, 2);
  //       },
  //     }
  //   );
  //   ist(pm.state.doc, doc(p("b")), eq);
  // });

  // it("cancels composition when a change fully overlaps with it", () => {
  //   const { view: pm } = requireFocus(
  //     tempEditor({ doc: doc(p("one"), p("two"), p("three")) })
  //   );
  //   compose(
  //     pm,
  //     () => edit(findTextNode(pm.dom, "two")!, "x"),
  //     [() => pm.dispatch(pm.state.tr.insertText("---", 3, 13))],
  //     { cancel: true }
  //   );
  //   ist(pm.state.doc, doc(p("on---hree")), eq);
  // });

  // it("cancels composition when a change partially overlaps with it", () => {
  //   const { view: pm } = requireFocus(
  //     tempEditor({ doc: doc(p("one"), p("two"), p("three")) })
  //   );
  //   compose(
  //     pm,
  //     () => edit(findTextNode(pm.dom, "two")!, "x", 0),
  //     [() => pm.dispatch(pm.state.tr.insertText("---", 7, 15))],
  //     { cancel: true }
  //   );
  //   ist(pm.state.doc, doc(p("one"), p("x---ee")), eq);
  // });

  // it("cancels composition when a change happens inside of it", () => {
  //   const { view: pm } = requireFocus(
  //     tempEditor({ doc: doc(p("one"), p("two"), p("three")) })
  //   );
  //   compose(
  //     pm,
  //     () => edit(findTextNode(pm.dom, "two")!, "x", 0),
  //     [() => pm.dispatch(pm.state.tr.insertText("!", 7, 8))],
  //     { cancel: true }
  //   );
  //   ist(pm.state.doc, doc(p("one"), p("x!wo"), p("three")), eq);
  // });

  // it("doesn't cancel composition when a change happens elsewhere", () => {
  //   const { view: pm } = requireFocus(
  //     tempEditor({ doc: doc(p("one"), p("two"), p("three")) })
  //   );
  //   compose(pm, () => edit(findTextNode(pm.dom, "two")!, "x", 0), [
  //     (n) => edit(n, "y", 1),
  //     () => pm.dispatch(pm.state.tr.insertText("!", 2, 3)),
  //     (n) => edit(n, "z", 2),
  //   ]);
  //   ist(pm.state.doc, doc(p("o!e"), p("xyztwo"), p("three")), eq);
  // });

  // it("handles compositions rapidly following each other", () => {
  //   const { view: pm } = tempEditor({ doc: doc(p("one"), p("two")) });
  //   event(pm, "compositionstart");
  //   const one = findTextNode(pm.dom, "one")!;
  //   edit(one, "!");
  //   pm.domObserver.flush();
  //   event(pm, "compositionend");
  //   one.nodeValue = "one!!";
  //   const L2 = pm.dom.lastChild;
  //   event(pm, "compositionstart");
  //   const two = findTextNode(pm.dom, "two")!;
  //   ist(pm.dom.lastChild, L2);
  //   edit(two, ".");
  //   pm.domObserver.flush();
  //   ist(document.getSelection()!.focusNode, two);
  //   ist(document.getSelection()!.focusOffset, 4);
  //   ist(pm.composing);
  //   event(pm, "compositionend");
  //   pm.domObserver.flush();
  //   ist(pm.state.doc, doc(p("one!!"), p("two.")), eq);
  // });

  // function crossParagraph(first = false) {
  //   const { view: pm } = requireFocus(
  //     tempEditor({ doc: doc(p("one <a>two"), p("three"), p("four<b> five")) })
  //   );
  //   compose(
  //     pm,
  //     () => {
  //       for (let i = 0; i < 2; i++)
  //         pm.dom.removeChild(first ? pm.dom.lastChild! : pm.dom.firstChild!);
  //       const target = pm.dom.firstChild!.firstChild as Text;
  //       target.nodeValue = "one A five";
  //       document.getSelection()!.collapse(target, 4);
  //       return target;
  //     },
  //     [(n) => edit(n, "B", 4, 5), (n) => edit(n, "C", 4, 5)]
  //   );
  //   ist(pm.state.doc, doc(p("one C five")), eq);
  // }

  // it("can handle cross-paragraph compositions", () => crossParagraph(true));

  // it("can handle cross-paragraph compositions (keeping the last paragraph)", () =>
  //   crossParagraph(false));
});
