/* eslint-disable @typescript-eslint/no-explicit-any */ /* eslint-disable @typescript-eslint/no-non-null-assertion */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _globals = require("@jest/globals");
const _react = require("@testing-library/react");
const _prosemirrorState = require("prosemirror-state");
const _prosemirrorTestBuilder = require("prosemirror-test-builder");
const _prosemirrorView = require("prosemirror-view");
const _editorViewTestHelpersJs = require("../../testing/editorViewTestHelpers.js");
const _setupProseMirrorViewJs = require("../../testing/setupProseMirrorView.js");
function endComposition(view, forceUpdate) {
    (0, _react.act)(()=>{
        (0, _prosemirrorView["__endComposition"])(view, forceUpdate);
    });
}
function event(pm, type) {
    (0, _react.act)(()=>{
        pm.dom.dispatchEvent(new CompositionEvent(type));
    });
}
function edit(node) {
    let text = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "", from = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : node.nodeValue.length, to = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : from;
    const val = node.nodeValue;
    node.nodeValue = val.slice(0, from) + text + val.slice(to);
    document.getSelection().collapse(node, from + text.length);
    return node;
}
function hasCompositionNode(_pm) {
    let { focusNode  } = document.getSelection();
    while(focusNode && !focusNode.pmViewDesc)focusNode = focusNode.parentNode;
    return focusNode && focusNode.pmViewDesc.constructor.name == "CompositionViewDesc";
}
function compose(pm, start, update) {
    let options = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
    event(pm, "compositionstart");
    (0, _globals.expect)(pm.composing).toBeTruthy();
    let node;
    const sel = document.getSelection();
    for(let i = -1; i < update.length; i++){
        if (i < 0) node = start();
        else update[i](node);
        const { focusNode , focusOffset  } = sel;
        (0, _react.act)(()=>{
            pm.domObserver.flush();
        });
        if (options.cancel && i == update.length - 1) {
            (0, _globals.expect)(hasCompositionNode(pm)).toBeFalsy();
        } else {
            (0, _globals.expect)(node.parentNode && pm.dom.contains(node.parentNode)).toBeTruthy();
            (0, _globals.expect)(sel.focusNode).toBe(focusNode);
            (0, _globals.expect)(sel.focusOffset).toBe(focusOffset);
        }
    }
    event(pm, "compositionend");
    if (options.end) {
        options.end(node);
        pm.domObserver.flush();
    }
    endComposition(pm);
    (0, _globals.expect)(pm.composing).toBeFalsy();
    (0, _globals.expect)(hasCompositionNode(pm)).toBeFalsy();
}
function wordDeco(state) {
    const re = /[^\s]+/g, deco = [];
    state.doc.descendants((node, pos)=>{
        if (node.isText) for(let m; m = re.exec(node.text);)deco.push(_prosemirrorView.Decoration.inline(pos + m.index, pos + m.index + m[0].length, {
            class: "word"
        }));
    });
    return _prosemirrorView.DecorationSet.create(state.doc, deco);
}
const wordHighlighter = new _prosemirrorState.Plugin({
    props: {
        decorations: wordDeco
    }
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
function insertComposition(dom) {
    _react.fireEvent.keyDown(dom, {
        key: "Dead",
        code: "Quote"
    });
    _react.fireEvent.compositionStart(dom);
    _react.fireEvent.compositionUpdate(dom, {
        data: "\xb4"
    });
    (0, _react.fireEvent)(dom, new InputEvent("beforeinput", {
        isComposing: true,
        inputType: "insertCompositionText",
        data: "\xb4"
    }));
    _react.fireEvent.input(dom, {
        isComposing: true,
        inputType: "insertCompositionText",
        data: "\xb4"
    });
    _react.fireEvent.keyUp(dom, {
        key: "\xb4",
        code: "Quote",
        isComposing: true
    });
    _react.fireEvent.keyDown(dom, {
        key: "\xe9",
        code: "KeyE",
        isComposing: true
    });
    _react.fireEvent.compositionUpdate(dom, {
        data: "\xe9"
    });
    (0, _react.fireEvent)(dom, new InputEvent("beforeinput", {
        isComposing: true,
        inputType: "insertCompositionText",
        data: "\xe9"
    }));
    _react.fireEvent.compositionEnd(dom, {
        inputType: "insertCompositionText",
        data: "\xe9"
    });
    _react.fireEvent.input(dom, {
        isComposing: true,
        inputType: "insertCompositionText",
        data: "\xe9"
    });
    _react.fireEvent.keyUp(dom, {
        key: "e",
        code: "KeyE"
    });
}
describe("EditorView composition", ()=>{
    beforeAll(()=>{
        (0, _setupProseMirrorViewJs.setupProseMirrorView)();
    });
    it("supports composition in an empty block", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("<a>"))
        });
        insertComposition(view.dom);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("\xe9")));
    });
    it("supports composition at end of block", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo<a>"))
        });
        insertComposition(view.dom);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo\xe9")));
    });
    it("supports composition at start of block in a new node", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("<a>foo"))
        });
        insertComposition(view.dom);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("\xe9foo")));
    });
    it("supports composition inside existing text", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("f<a>oo"))
        });
        insertComposition(view.dom);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("f\xe9oo")));
    });
    // TODO: Deal with Android style compositions
    // eslint-disable-next-line jest/no-disabled-tests
    it.skip("can deal with Android-style newline-after-composition", ()=>{
        const { view: pm  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("abcdef"))
        });
        compose(pm, ()=>edit((0, _editorViewTestHelpersJs.findTextNode)(pm.dom, "abcdef")), [
            (n)=>edit(n, "x", 3),
            (n)=>edit(n, "y", 4)
        ], {
            end: (n)=>{
                const line = pm.dom.appendChild(document.createElement("div"));
                line.textContent = "def";
                n.nodeValue = "abcxy";
                document.getSelection().collapse(line, 0);
            }
        });
        (0, _globals.expect)(pm.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("abcxy"), (0, _prosemirrorTestBuilder.p)("def")));
    });
    it("handles replacement of existing words", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("one <a>two<b> three"))
        });
        insertComposition(view.dom);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("one \xe9 three")));
    });
    it("handles composition inside marks", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("one ", (0, _prosemirrorTestBuilder.em)("two<a>")))
        });
        insertComposition(view.dom);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("one ", (0, _prosemirrorTestBuilder.em)("two\xe9"))));
    });
    it("handles composition in a mark that has multiple children", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("one ", (0, _prosemirrorTestBuilder.em)("two<a>", (0, _prosemirrorTestBuilder.strong)(" three"))))
        });
        insertComposition(view.dom);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("one ", (0, _prosemirrorTestBuilder.em)("two\xe9", (0, _prosemirrorTestBuilder.strong)(" three")))));
    });
    // This passes, but I think it shouldn't; it doesn't seem to work
    // in the demo
    it.skip("supports composition in a cursor wrapper", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("<a>"))
        });
        view.dispatch(view.state.tr.addStoredMark(_prosemirrorTestBuilder.schema.marks.em.create()));
        insertComposition(view.dom);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)((0, _prosemirrorTestBuilder.em)("\xe9"))));
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
    it.skip("doesn't get interrupted by changes in decorations", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo <a>...<b>")),
            plugins: [
                wordHighlighter
            ]
        });
        insertComposition(view.dom);
        (0, _globals.expect)(view.state.doc).toEqualNode((0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo \xe9")));
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
