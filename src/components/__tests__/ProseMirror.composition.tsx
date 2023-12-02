/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect } from "@jest/globals";
import { act, fireEvent } from "@testing-library/react";
import { EditorState, Plugin } from "prosemirror-state";
import { doc, em, p, schema, strong } from "prosemirror-test-builder";
import {
  Decoration,
  DecorationSet,
  EditorView,
  // @ts-expect-error This is an internal export
  __endComposition,
} from "prosemirror-view";

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
      (pm as any).domObserver.flush();
    });

    if (options.cancel && i == update.length - 1) {
      expect(hasCompositionNode(pm)).toBeFalsy();
    } else {
      expect(
        node!.parentNode! && pm.dom.contains(node!.parentNode!)
      ).toBeTruthy();
      expect(sel.focusNode).toBe(focusNode);
      expect(sel.focusOffset).toBe(focusOffset);
    }
  }
  event(pm, "compositionend");
  if (options.end) {
    options.end(node!);
    (pm as any).domObserver.flush();
  }
  endComposition(pm);
  expect(pm.composing).toBeFalsy();
  expect(hasCompositionNode(pm)).toBeFalsy();
}

function wordDeco(state: EditorState) {
  const re = /[^\s]+/g,
    deco: Decoration[] = [];
  state.doc.descendants((node, pos) => {
    if (node.isText)
      for (let m; (m = re.exec(node.text!)); )
        deco.push(
          Decoration.inline(pos + m.index, pos + m.index + m[0].length, {
            class: "word",
          })
        );
  });
  return DecorationSet.create(state.doc, deco);
}

const wordHighlighter = new Plugin({
  props: { decorations: wordDeco },
});

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

function insertComposition(dom: Element) {
  fireEvent.keyDown(dom, { key: "Dead", code: "Quote" });
  fireEvent.compositionStart(dom);
  fireEvent.compositionUpdate(dom, { data: "´" });
  fireEvent(
    dom,
    new InputEvent("beforeinput", {
      isComposing: true,
      inputType: "insertCompositionText",
      data: "´",
    })
  );
  fireEvent.input(dom, {
    isComposing: true,
    inputType: "insertCompositionText",
    data: "´",
  });
  fireEvent.keyUp(dom, { key: "´", code: "Quote", isComposing: true });

  fireEvent.keyDown(dom, { key: "é", code: "KeyE", isComposing: true });
  fireEvent.compositionUpdate(dom, { data: "é" });
  fireEvent(
    dom,
    new InputEvent("beforeinput", {
      isComposing: true,
      inputType: "insertCompositionText",
      data: "é",
    })
  );
  fireEvent.compositionEnd(dom, {
    inputType: "insertCompositionText",
    data: "é",
  });
  fireEvent.input(dom, {
    isComposing: true,
    inputType: "insertCompositionText",
    data: "é",
  });
  fireEvent.keyUp(dom, { key: "e", code: "KeyE" });
}

describe("EditorView composition", () => {
  beforeAll(() => {
    setupProseMirrorView();
  });

  it("supports composition in an empty block", () => {
    const { view } = tempEditor({ doc: doc(p("<a>")) });
    insertComposition(view.dom);
    expect(view.state.doc).toEqualNode(doc(p("é")));
  });

  it("supports composition at end of block", () => {
    const { view } = tempEditor({ doc: doc(p("foo<a>")) });
    insertComposition(view.dom);
    expect(view.state.doc).toEqualNode(doc(p("fooé")));
  });

  it("supports composition at start of block in a new node", () => {
    const { view } = tempEditor({ doc: doc(p("<a>foo")) });
    insertComposition(view.dom);
    expect(view.state.doc).toEqualNode(doc(p("éfoo")));
  });

  it("supports composition inside existing text", () => {
    const { view } = tempEditor({ doc: doc(p("f<a>oo")) });
    insertComposition(view.dom);
    expect(view.state.doc).toEqualNode(doc(p("féoo")));
  });

  // TODO: Deal with Android style compositions
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
    const { view } = tempEditor({ doc: doc(p("one <a>two<b> three")) });
    insertComposition(view.dom);
    expect(view.state.doc).toEqualNode(doc(p("one é three")));
  });

  it("handles composition inside marks", () => {
    const { view } = tempEditor({ doc: doc(p("one ", em("two<a>"))) });
    insertComposition(view.dom);
    expect(view.state.doc).toEqualNode(doc(p("one ", em("twoé"))));
  });

  it("handles composition in a mark that has multiple children", () => {
    const { view } = tempEditor({
      doc: doc(p("one ", em("two<a>", strong(" three")))),
    });
    insertComposition(view.dom);
    expect(view.state.doc).toEqualNode(
      doc(p("one ", em("twoé", strong(" three"))))
    );
  });

  // This passes, but I think it shouldn't; it doesn't seem to work
  // in the demo
  it.skip("supports composition in a cursor wrapper", () => {
    const { view } = tempEditor({ doc: doc(p("<a>")) });
    view.dispatch(view.state.tr.addStoredMark(schema.marks.em!.create()));
    insertComposition(view.dom);
    expect(view.state.doc).toEqualNode(doc(p(em("é"))));
  });

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

  // TODO: This also passes but does not actually work in the
  // demo :(
  it.skip("doesn't get interrupted by changes in decorations", () => {
    const { view } = tempEditor({
      doc: doc(p("foo <a>...<b>")),
      plugins: [wordHighlighter],
    });
    insertComposition(view.dom);
    expect(view.state.doc).toEqualNode(doc(p("foo é")));
  });

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
  //   (pm as any).domObserver.flush();
  //   event(pm, "compositionend");
  //   one.nodeValue = "one!!";
  //   const L2 = pm.dom.lastChild;
  //   event(pm, "compositionstart");
  //   const two = findTextNode(pm.dom, "two")!;
  //   ist(pm.dom.lastChild, L2);
  //   edit(two, ".");
  //   (pm as any).domObserver.flush();
  //   ist(document.getSelection()!.focusNode, two);
  //   ist(document.getSelection()!.focusOffset, 4);
  //   ist(pm.composing);
  //   event(pm, "compositionend");
  //   (pm as any).domObserver.flush();
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
