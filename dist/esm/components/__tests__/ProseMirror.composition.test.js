/* eslint-disable @typescript-eslint/no-explicit-any */ /* eslint-disable @typescript-eslint/no-non-null-assertion */ function _extends() {
    _extends = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends.apply(this, arguments);
}
import { fireEvent } from "@testing-library/react";
import { Plugin } from "prosemirror-state";
import { code, doc, em, p, schema, strong } from "prosemirror-test-builder";
import { Decoration, DecorationSet } from "prosemirror-view";
import React, { forwardRef } from "react";
import { widget } from "../../decorations/ReactWidgetType.js";
import { tempEditor } from "../../testing/editorViewTestHelpers.js";
// function endComposition(view: EditorView, forceUpdate?: boolean) {
//   act(() => {
//     __endComposition(view, forceUpdate);
//   });
// }
// function event(pm: EditorView, type: string) {
//   act(() => {
//     pm.dom.dispatchEvent(new CompositionEvent(type));
//   });
// }
// function edit(node: Text, text = "", from = node.nodeValue!.length, to = from) {
//   const val = node.nodeValue!;
//   node.nodeValue = val.slice(0, from) + text + val.slice(to);
//   document.getSelection()!.collapse(node, from + text.length);
//   return node;
// }
// function hasCompositionNode(_pm: EditorView) {
//   let { focusNode } = document.getSelection()!;
//   while (focusNode && !focusNode.pmViewDesc) focusNode = focusNode.parentNode;
//   return (
//     focusNode && focusNode.pmViewDesc!.constructor.name == "CompositionViewDesc"
//   );
// }
// function compose(
//   pm: EditorView,
//   start: () => Text,
//   update: ((node: Text) => void)[],
//   options: any = {}
// ) {
//   event(pm, "compositionstart");
//   expect(pm.composing).toBeTruthy();
//   let node: Text;
//   const sel = document.getSelection()!;
//   for (let i = -1; i < update.length; i++) {
//     if (i < 0) node = start();
//     else update[i]!(node!);
//     const { focusNode, focusOffset } = sel;
//     act(() => {
//       (pm as any).domObserver.flush();
//     });
//     if (options.cancel && i == update.length - 1) {
//       expect(hasCompositionNode(pm)).toBeFalsy();
//     } else {
//       expect(
//         node!.parentNode! && pm.dom.contains(node!.parentNode!)
//       ).toBeTruthy();
//       expect(sel.focusNode).toBe(focusNode);
//       expect(sel.focusOffset).toBe(focusOffset);
//     }
//   }
//   event(pm, "compositionend");
//   if (options.end) {
//     options.end(node!);
//     (pm as any).domObserver.flush();
//   }
//   endComposition(pm);
//   expect(pm.composing).toBeFalsy();
//   expect(hasCompositionNode(pm)).toBeFalsy();
// }
function wordDeco(state) {
    const re = /[^\s]+/g, deco = [];
    state.doc.descendants((node, pos)=>{
        if (node.isText) for(let m; m = re.exec(node.text);)deco.push(Decoration.inline(pos + m.index, pos + m.index + m[0].length, {
            class: "word"
        }));
    });
    return DecorationSet.create(state.doc, deco);
}
const wordHighlighter = new Plugin({
    props: {
        decorations: wordDeco
    }
});
const Widget = /*#__PURE__*/ forwardRef(function Widget(param, ref) {
    let { widget , pos , ...props } = param;
    return /*#__PURE__*/ React.createElement("var", _extends({
        ref: ref
    }, props), "\xd7");
});
function widgets(positions, sides) {
    return new Plugin({
        state: {
            init (config) {
                const deco = positions.map((p, i)=>widget(p, Widget, {
                        side: sides[i]
                    }));
                return config.doc ? DecorationSet.create(config.doc, deco) : DecorationSet.empty;
            },
            apply (tr, deco) {
                return deco.map(tr.mapping, tr.doc);
            }
        },
        props: {
            decorations (state) {
                return this.getState(state);
            }
        }
    });
}
function insertComposition(dom) {
    fireEvent.keyDown(dom, {
        key: "Dead",
        code: "Quote"
    });
    fireEvent.compositionStart(dom);
    fireEvent.compositionUpdate(dom, {
        data: "\xb4"
    });
    fireEvent(dom, new InputEvent("beforeinput", {
        isComposing: true,
        inputType: "insertCompositionText",
        data: "\xb4"
    }));
    fireEvent.input(dom, {
        isComposing: true,
        inputType: "insertCompositionText",
        data: "\xb4"
    });
    fireEvent.keyUp(dom, {
        key: "\xb4",
        code: "Quote",
        isComposing: true
    });
    fireEvent.keyDown(dom, {
        key: "\xe9",
        code: "KeyE",
        isComposing: true
    });
    fireEvent.compositionUpdate(dom, {
        data: "\xe9"
    });
    fireEvent(dom, new InputEvent("beforeinput", {
        isComposing: true,
        inputType: "insertCompositionText",
        data: "\xe9"
    }));
    fireEvent.compositionEnd(dom, {
        inputType: "insertCompositionText",
        data: "\xe9"
    });
    fireEvent.input(dom, {
        isComposing: true,
        inputType: "insertCompositionText",
        data: "\xe9"
    });
    fireEvent.keyUp(dom, {
        key: "e",
        code: "KeyE"
    });
}
describe("EditorView composition", ()=>{
    it("supports composition in an empty block", ()=>{
        const { view  } = tempEditor({
            doc: doc(p("<a>"))
        });
        insertComposition(view.dom);
        expect(view.state.doc).toEqualNode(doc(p("\xe9")));
    });
    it("supports composition at end of block", ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foo<a>"))
        });
        insertComposition(view.dom);
        expect(view.state.doc).toEqualNode(doc(p("foo\xe9")));
    });
    it("supports composition at start of block in a new node", ()=>{
        const { view  } = tempEditor({
            doc: doc(p("<a>foo"))
        });
        insertComposition(view.dom);
        expect(view.state.doc).toEqualNode(doc(p("\xe9foo")));
    });
    it("supports composition inside existing text", ()=>{
        const { view  } = tempEditor({
            doc: doc(p("f<a>oo"))
        });
        insertComposition(view.dom);
        expect(view.state.doc).toEqualNode(doc(p("f\xe9oo")));
    });
    // TODO: Deal with Android style compositions
    // eslint-disable-next-line jest/no-disabled-tests
    // it.skip("can deal with Android-style newline-after-composition", () => {
    //   const { view: pm } = tempEditor({ doc: doc(p("abcdef")) });
    //   compose(
    //     pm,
    //     () => edit(findTextNode(pm.dom, "abcdef")!),
    //     [(n) => edit(n, "x", 3), (n) => edit(n, "y", 4)],
    //     {
    //       end: (n: Text) => {
    //         const line = pm.dom.appendChild(document.createElement("div"));
    //         line.textContent = "def";
    //         n.nodeValue = "abcxy";
    //         document.getSelection()!.collapse(line, 0);
    //       },
    //     }
    //   );
    //   expect(pm.state.doc).toEqualNode(doc(p("abcxy"), p("def")));
    // });
    it("handles replacement of existing words", ()=>{
        const { view  } = tempEditor({
            doc: doc(p("one <a>two<b> three"))
        });
        insertComposition(view.dom);
        expect(view.state.doc).toEqualNode(doc(p("one \xe9 three")));
    });
    it("handles composition inside marks", ()=>{
        const { view  } = tempEditor({
            doc: doc(p("one ", em("two<a>")))
        });
        insertComposition(view.dom);
        expect(view.state.doc).toEqualNode(doc(p("one ", em("two\xe9"))));
    });
    it("handles composition in a mark that has multiple children", ()=>{
        const { view  } = tempEditor({
            doc: doc(p("one ", em("two<a>", strong(" three"))))
        });
        insertComposition(view.dom);
        expect(view.state.doc).toEqualNode(doc(p("one ", em("two\xe9", strong(" three")))));
    });
    it("supports composition in a cursor wrapper", ()=>{
        const { view  } = tempEditor({
            doc: doc(p("<a>"))
        });
        view.dispatch(view.state.tr.addStoredMark(schema.marks.em.create()));
        insertComposition(view.dom);
        expect(view.state.doc).toEqualNode(doc(p(em("\xe9"))));
    });
    it("handles composition in a multi-child mark with a cursor wrapper", ()=>{
        const { view  } = tempEditor({
            doc: doc(p("one ", em("two<a>", strong(" three"))))
        });
        view.dispatch(view.state.tr.addStoredMark(schema.marks.code.create()));
        insertComposition(view.dom);
        expect(view.state.doc).toEqualNode(doc(p("one ", em("two", code("\xe9"), strong(" three")))));
    });
    it("doesn't get interrupted by changes in decorations", ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foo <a>...<b>")),
            plugins: [
                wordHighlighter
            ]
        });
        insertComposition(view.dom);
        expect(view.state.doc).toEqualNode(doc(p("foo \xe9")));
    });
    it("works inside highlighted text", ()=>{
        const { view  } = tempEditor({
            doc: doc(p("one<a> two")),
            plugins: [
                wordHighlighter
            ]
        });
        insertComposition(view.dom);
        expect(view.state.doc).toEqualNode(doc(p("one\xe9 two")));
    });
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
    it("doesn't overwrite widgets next to the composition", ()=>{
        const { view  } = tempEditor({
            doc: doc(p("")),
            plugins: [
                widgets([
                    1,
                    1
                ], [
                    -1,
                    1
                ])
            ]
        });
        insertComposition(view.dom);
        expect(view.state.doc).toEqualNode(doc(p("\xe9")));
    });
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
