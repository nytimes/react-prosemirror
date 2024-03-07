/* eslint-disable @typescript-eslint/no-non-null-assertion */ // TODO: figure out whether it's possible to support native
// widgets. Right now, I'm not sure how we'd do it without
// wrapping them in another element, which would re-introduce
// all of the issues we had before with node views.
//
// For now, we've updated the factory in this file to use
// our React widgets.
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _react = require("@testing-library/react");
const _prosemirrorModel = require("prosemirror-model");
const _prosemirrorState = require("prosemirror-state");
const _prosemirrorTestBuilder = require("prosemirror-test-builder");
const _prosemirrorView = require("prosemirror-view");
const _react1 = /*#__PURE__*/ _interopRequireWildcard(require("react"));
const _reactWidgetTypeJs = require("../../decorations/ReactWidgetType.js");
const _useEditorEffectJs = require("../../hooks/useEditorEffect.js");
const _editorViewTestHelpersJs = require("../../testing/editorViewTestHelpers.js");
function _extends() {
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
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interopRequireWildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {};
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
const Widget = /*#__PURE__*/ (0, _react1.forwardRef)(function Widget(props, ref) {
    return /*#__PURE__*/ _react1.default.createElement("button", _extends({
        ref: ref
    }, props), "ω");
});
function make(str) {
    if (typeof str != "string") return str;
    const match = /^(\d+)(?:-(\d+))?-(.+)$/.exec(str);
    if (match[3] == "widget") {
        return (0, _reactWidgetTypeJs.widget)(+match[1], Widget, {
            key: str
        });
    }
    return _prosemirrorView.Decoration.inline(+match[1], +match[2], {
        class: match[3]
    });
}
function decoPlugin(decos) {
    return new _prosemirrorState.Plugin({
        state: {
            init (config) {
                return config.doc ? _prosemirrorView.DecorationSet.create(config.doc, decos.map(make)) : _prosemirrorView.DecorationSet.empty;
            },
            apply (tr, set, state) {
                if (tr.docChanged) {
                    if (set === _prosemirrorView.DecorationSet.empty) {
                        set = _prosemirrorView.DecorationSet.create(tr.doc, decos.map(make));
                    }
                    set = set.map(tr.mapping, tr.doc);
                }
                const change = tr.getMeta("updateDecorations");
                if (change) {
                    if (change.remove) set = set.remove(change.remove);
                    if (change.add) set = set.add(state.doc, change.add);
                }
                return set;
            }
        },
        props: {
            decorations (state) {
                return this.getState(state);
            }
        }
    });
}
function updateDeco(view, add, remove) {
    view.dispatch(view.state.tr.setMeta("updateDecorations", {
        add,
        remove
    }));
}
describe("Decoration drawing", ()=>{
    it("draws inline decorations", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foobar")),
            plugins: [
                decoPlugin([
                    "2-5-foo"
                ])
            ]
        });
        const found = view.dom.querySelector(".foo");
        expect(found).not.toBeNull();
        expect(found.textContent).toBe("oob");
    });
    it("draws wrapping decorations", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo")),
            plugins: [
                decoPlugin([
                    _prosemirrorView.Decoration.inline(1, 5, {
                        nodeName: "i"
                    })
                ])
            ]
        });
        const found = view.dom.querySelector("i");
        expect(found && found.innerHTML).toBe("foo");
    });
    it("draws node decorations", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo"), (0, _prosemirrorTestBuilder.p)("bar")),
            plugins: [
                decoPlugin([
                    _prosemirrorView.Decoration.node(5, 10, {
                        class: "cls"
                    })
                ])
            ]
        });
        const found = view.dom.querySelectorAll(".cls");
        expect(found).toHaveLength(1);
        expect(found[0].nodeName).toBe("P");
        expect(found[0].previousSibling.nodeName).toBe("P");
    });
    it("can update multi-level wrapping decorations", ()=>{
        const d2 = _prosemirrorView.Decoration.inline(1, 5, {
            nodeName: "i",
            class: "b"
        });
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("hello")),
            plugins: [
                decoPlugin([
                    _prosemirrorView.Decoration.inline(1, 5, {
                        nodeName: "i",
                        class: "a"
                    }),
                    d2
                ])
            ]
        });
        expect(view.dom.querySelectorAll("i")).toHaveLength(2);
        (0, _react.act)(()=>{
            updateDeco(view, [
                _prosemirrorView.Decoration.inline(1, 5, {
                    nodeName: "i",
                    class: "c"
                })
            ], [
                d2
            ]);
        });
        const iNodes = view.dom.querySelectorAll("i");
        expect(iNodes).toHaveLength(2);
        expect(Array.prototype.map.call(iNodes, (n)=>n.className).sort().join()).toBe("a,c");
    });
    it("draws overlapping inline decorations", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("abcdef")),
            plugins: [
                decoPlugin([
                    "3-5-foo",
                    "4-6-bar",
                    "1-7-baz"
                ])
            ]
        });
        const baz = view.dom.querySelectorAll(".baz");
        expect(baz).toHaveLength(5);
        expect(Array.prototype.map.call(baz, (x)=>x.textContent).join("-")).toBe("ab-c-d-e-f");
        function classes(n) {
            return n.className.split(" ").sort().join(" ");
        }
        expect(classes(baz[1])).toBe("baz foo");
        expect(classes(baz[2])).toBe("bar baz foo");
        expect(classes(baz[3])).toBe("bar baz");
    });
    it("draws multiple widgets", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foobar")),
            plugins: [
                decoPlugin([
                    "1-widget",
                    "4-widget",
                    "7-widget"
                ])
            ]
        });
        const found = view.dom.querySelectorAll("button");
        expect(found).toHaveLength(3);
        expect(found[0].nextSibling.textContent).toBe("foo");
        expect(found[1].nextSibling.textContent).toBe("bar");
        expect(found[2].previousSibling.textContent).toBe("bar");
    });
    it("orders widgets by their side option", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foobar")),
            plugins: [
                decoPlugin([
                    (0, _reactWidgetTypeJs.widget)(4, /*#__PURE__*/ (0, _react1.forwardRef)(function B(props, ref) {
                        return /*#__PURE__*/ _react1.default.createElement("span", _extends({
                            ref: ref
                        }, props), "B");
                    }), {
                        key: "widget-b"
                    }),
                    (0, _reactWidgetTypeJs.widget)(4, /*#__PURE__*/ (0, _react1.forwardRef)(function A(props, ref) {
                        return /*#__PURE__*/ _react1.default.createElement("span", _extends({
                            ref: ref
                        }, props), "A");
                    }), {
                        side: -100,
                        key: "widget-a"
                    }),
                    (0, _reactWidgetTypeJs.widget)(4, /*#__PURE__*/ (0, _react1.forwardRef)(function C(props, ref) {
                        return /*#__PURE__*/ _react1.default.createElement("span", _extends({
                            ref: ref
                        }, props), "C");
                    }), {
                        side: 2,
                        key: "widget-c"
                    })
                ])
            ]
        });
        expect(view.dom.textContent).toBe("fooABCbar");
    });
    it("draws a widget in an empty node", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)()),
            plugins: [
                decoPlugin([
                    "1-widget"
                ])
            ]
        });
        expect(view.dom.querySelectorAll("button")).toHaveLength(1);
    });
    it("draws widgets on node boundaries", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo", (0, _prosemirrorTestBuilder.em)("bar"))),
            plugins: [
                decoPlugin([
                    "4-widget"
                ])
            ]
        });
        expect(view.dom.querySelectorAll("button")).toHaveLength(1);
    });
    it("draws decorations from multiple plugins", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo", (0, _prosemirrorTestBuilder.em)("bar"))),
            plugins: [
                decoPlugin([
                    "2-widget"
                ]),
                decoPlugin([
                    "6-widget"
                ])
            ]
        });
        expect(view.dom.querySelectorAll("button")).toHaveLength(2);
    });
    it("calls widget destroy methods", ()=>{
        let destroyed = false;
        const DestroyableWidget = /*#__PURE__*/ (0, _react1.forwardRef)(function DestroyableWidget(props, ref) {
            (0, _react1.useEffect)(()=>{
                destroyed = true;
            });
            return /*#__PURE__*/ _react1.default.createElement("button", _extends({
                ref: ref
            }, props));
        });
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("abc")),
            plugins: [
                decoPlugin([
                    (0, _reactWidgetTypeJs.widget)(2, DestroyableWidget, {
                        key: "destroyable-widget"
                    })
                ])
            ]
        });
        (0, _react.act)(()=>{
            view.dispatch(view.state.tr.delete(1, 4));
        });
        expect(destroyed).toBeTruthy();
    });
    it("draws inline decorations spanning multiple parents", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("long first ", (0, _prosemirrorTestBuilder.em)("p"), "aragraph"), (0, _prosemirrorTestBuilder.p)("two")),
            plugins: [
                decoPlugin([
                    "7-25-foo"
                ])
            ]
        });
        const foos = view.dom.querySelectorAll(".foo");
        expect(foos).toHaveLength(4);
        expect(foos[0].textContent).toBe("irst ");
        expect(foos[1].textContent).toBe("p");
        expect(foos[2].textContent).toBe("aragraph");
        expect(foos[3].textContent).toBe("tw");
    });
    it("draws inline decorations across empty paragraphs", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("first"), (0, _prosemirrorTestBuilder.p)(), (0, _prosemirrorTestBuilder.p)("second")),
            plugins: [
                decoPlugin([
                    "3-12-foo"
                ])
            ]
        });
        const foos = view.dom.querySelectorAll(".foo");
        expect(foos).toHaveLength(2);
        expect(foos[0].textContent).toBe("rst");
        expect(foos[1].textContent).toBe("se");
    });
    it("can handle inline decorations ending at the start or end of a node", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)(), (0, _prosemirrorTestBuilder.p)()),
            plugins: [
                decoPlugin([
                    "1-3-foo"
                ])
            ]
        });
        expect(view.dom.querySelector(".foo")).toBeNull();
    });
    it("can draw decorations with multiple classes", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo")),
            plugins: [
                decoPlugin([
                    "1-4-foo bar"
                ])
            ]
        });
        expect(view.dom.querySelectorAll(".foo")).toHaveLength(1);
        expect(view.dom.querySelectorAll(".bar")).toHaveLength(1);
    });
    it("supports overlapping inline decorations", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foobar")),
            plugins: [
                decoPlugin([
                    "1-3-foo",
                    "2-5-bar"
                ])
            ]
        });
        const foos = view.dom.querySelectorAll(".foo");
        const bars = view.dom.querySelectorAll(".bar");
        expect(foos).toHaveLength(2);
        expect(bars).toHaveLength(2);
        expect(foos[0].textContent).toBe("f");
        expect(foos[1].textContent).toBe("o");
        expect(bars[0].textContent).toBe("o");
        expect(bars[1].textContent).toBe("ob");
    });
    it("doesn't redraw when irrelevant decorations change", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo"), (0, _prosemirrorTestBuilder.p)("baz")),
            plugins: [
                decoPlugin([
                    "7-8-foo"
                ])
            ]
        });
        const para2 = view.dom.lastChild;
        (0, _react.act)(()=>{
            updateDeco(view, [
                make("2-3-bar")
            ]);
        });
        expect(view.dom.lastChild).toBe(para2);
        expect(view.dom.querySelector(".bar")).not.toBeNull();
    });
    it("doesn't redraw when irrelevant content changes", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo"), (0, _prosemirrorTestBuilder.p)("baz")),
            plugins: [
                decoPlugin([
                    "7-8-foo"
                ])
            ]
        });
        const para2 = view.dom.lastChild;
        (0, _react.act)(()=>{
            view.dispatch(view.state.tr.delete(2, 3));
            view.dispatch(view.state.tr.delete(2, 3));
        });
        expect(view.dom.lastChild).toBe(para2);
    });
    it("can add a widget on a node boundary", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo", (0, _prosemirrorTestBuilder.em)("bar"))),
            plugins: [
                decoPlugin([])
            ]
        });
        (0, _react.act)(()=>{
            updateDeco(view, [
                make("4-widget")
            ]);
        });
        expect(view.dom.querySelectorAll("button")).toHaveLength(1);
    });
    it("can remove a widget on a node boundary", ()=>{
        const dec = make("4-widget");
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo", (0, _prosemirrorTestBuilder.em)("bar"))),
            plugins: [
                decoPlugin([
                    dec
                ])
            ]
        });
        (0, _react.act)(()=>{
            updateDeco(view, null, [
                dec
            ]);
        });
        expect(view.dom.querySelector("button")).toBeNull();
    });
    it("can remove the class from a text node", ()=>{
        const dec = make("1-4-foo");
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("abc")),
            plugins: [
                decoPlugin([
                    dec
                ])
            ]
        });
        expect(view.dom.querySelector(".foo")).not.toBeNull();
        (0, _react.act)(()=>{
            updateDeco(view, null, [
                dec
            ]);
        });
        expect(view.dom.querySelector(".foo")).toBeNull();
    });
    it("can remove the class from part of a text node", ()=>{
        const dec = make("2-4-foo");
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("abcd")),
            plugins: [
                decoPlugin([
                    dec
                ])
            ]
        });
        expect(view.dom.querySelector(".foo")).not.toBeNull();
        (0, _react.act)(()=>{
            updateDeco(view, null, [
                dec
            ]);
        });
        expect(view.dom.querySelector(".foo")).toBeNull();
        expect(view.dom.firstChild.innerHTML).toBe("abcd");
    });
    it("can change the class for part of a text node", ()=>{
        const dec = make("2-4-foo");
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("abcd")),
            plugins: [
                decoPlugin([
                    dec
                ])
            ]
        });
        expect(view.dom.querySelector(".foo")).not.toBeNull();
        (0, _react.act)(()=>{
            updateDeco(view, [
                make("2-4-bar")
            ], [
                dec
            ]);
        });
        expect(view.dom.querySelector(".foo")).toBeNull();
        expect(view.dom.querySelector(".bar")).not.toBeNull();
    });
    it("draws a widget added in the middle of a text node", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo")),
            plugins: [
                decoPlugin([])
            ]
        });
        (0, _react.act)(()=>{
            updateDeco(view, [
                make("3-widget")
            ]);
        });
        expect(view.dom.firstChild.textContent).toBe("foωo");
    });
    it("can update a text node around a widget", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("bar")),
            plugins: [
                decoPlugin([
                    "3-widget"
                ])
            ]
        });
        (0, _react.act)(()=>{
            view.dispatch(view.state.tr.delete(1, 2));
        });
        expect(view.dom.querySelectorAll("button")).toHaveLength(1);
        expect(view.dom.firstChild.textContent).toBe("aωr");
    });
    it("can update a text node with an inline decoration", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("bar")),
            plugins: [
                decoPlugin([
                    "1-3-foo"
                ])
            ]
        });
        (0, _react.act)(()=>{
            view.dispatch(view.state.tr.delete(1, 2));
        });
        const foo = view.dom.querySelector(".foo");
        expect(foo).not.toBeNull();
        expect(foo.textContent).toBe("a");
        expect(foo.nextSibling.textContent).toBe("r");
    });
    it("correctly redraws a partially decorated node when a widget is added", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("one", (0, _prosemirrorTestBuilder.em)("two"))),
            plugins: [
                decoPlugin([
                    "1-6-foo"
                ])
            ]
        });
        (0, _react.act)(()=>{
            updateDeco(view, [
                make("6-widget")
            ]);
        });
        const foos = view.dom.querySelectorAll(".foo");
        expect(foos).toHaveLength(2);
        expect(foos[0].textContent).toBe("one");
        expect(foos[1].textContent).toBe("tw");
    });
    it("correctly redraws when skipping split text node", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo")),
            plugins: [
                decoPlugin([
                    "3-widget",
                    "3-4-foo"
                ])
            ]
        });
        (0, _react.act)(()=>{
            updateDeco(view, [
                make("4-widget")
            ]);
        });
        expect(view.dom.querySelectorAll("button")).toHaveLength(2);
    });
    it("drops removed node decorations from the view", ()=>{
        const deco = _prosemirrorView.Decoration.node(1, 6, {
            class: "cls"
        });
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.blockquote)((0, _prosemirrorTestBuilder.p)("foo"), (0, _prosemirrorTestBuilder.p)("bar"))),
            plugins: [
                decoPlugin([
                    deco
                ])
            ]
        });
        (0, _react.act)(()=>{
            updateDeco(view, null, [
                deco
            ]);
        });
        expect(view.dom.querySelector(".cls")).toBeNull();
    });
    it("can update a node's attributes without replacing the node", ()=>{
        const deco = _prosemirrorView.Decoration.node(0, 5, {
            title: "title",
            class: "foo"
        });
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo")),
            plugins: [
                decoPlugin([
                    deco
                ])
            ]
        });
        const para = view.dom.querySelector("p");
        (0, _react.act)(()=>{
            updateDeco(view, [
                _prosemirrorView.Decoration.node(0, 5, {
                    class: "foo bar"
                })
            ], [
                deco
            ]);
        });
        expect(view.dom.querySelector("p")).toBe(para);
        expect(para.className).toBe("foo bar");
        expect(para.title).toBeFalsy();
    });
    it("can add and remove CSS custom properties from a node", ()=>{
        const deco = _prosemirrorView.Decoration.node(0, 5, {
            style: "--my-custom-property:36px"
        });
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo")),
            plugins: [
                decoPlugin([
                    deco
                ])
            ]
        });
        expect(view.dom.querySelector("p").style.getPropertyValue("--my-custom-property")).toBe("36px");
        (0, _react.act)(()=>{
            updateDeco(view, null, [
                deco
            ]);
        });
        expect(view.dom.querySelector("p").style.getPropertyValue("--my-custom-property")).toBe("");
    });
    it("updates decorated nodes even if a widget is added before them", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("a"), (0, _prosemirrorTestBuilder.p)("b")),
            plugins: [
                decoPlugin([])
            ]
        });
        const lastP = view.dom.querySelectorAll("p")[1];
        (0, _react.act)(()=>{
            updateDeco(view, [
                make("3-widget"),
                _prosemirrorView.Decoration.node(3, 6, {
                    style: "color: red"
                })
            ]);
        });
        expect(lastP.style.color).toBe("red");
    });
    it("doesn't redraw nodes when a widget before them is replaced", ()=>{
        const w0 = make("3-widget");
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.h1)("a"), (0, _prosemirrorTestBuilder.p)("b")),
            plugins: [
                decoPlugin([
                    w0
                ])
            ]
        });
        const initialP = view.dom.querySelector("p");
        (0, _react.act)(()=>{
            view.dispatch(view.state.tr.setMeta("updateDecorations", {
                add: [
                    make("3-widget")
                ],
                remove: [
                    w0
                ]
            }).insertText("c", 5));
        });
        expect(view.dom.querySelector("p")).toBe(initialP);
    });
    it("can add and remove inline style", ()=>{
        const deco = _prosemirrorView.Decoration.inline(1, 6, {
            style: "color: rgba(0,10,200,.4); text-decoration: underline"
        });
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("al", (0, _prosemirrorTestBuilder.img)(), "lo")),
            plugins: [
                decoPlugin([
                    deco
                ])
            ]
        });
        expect(view.dom.querySelector("img").style.color).toMatch(/rgba/);
        expect(view.dom.querySelector("img").previousSibling.style.textDecoration).toBe("underline");
        (0, _react.act)(()=>{
            updateDeco(view, null, [
                deco
            ]);
        });
        expect(view.dom.querySelector("img").style.color).toBe("");
        expect(view.dom.querySelector("img").style.textDecoration).toBe("");
    });
    it("passes decorations to a node view", ()=>{
        let current = "";
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo"), (0, _prosemirrorTestBuilder.hr)()),
            plugins: [
                decoPlugin([])
            ],
            nodeViews: {
                horizontal_rule: /*#__PURE__*/ (0, _react1.forwardRef)(function HR(props, ref) {
                    current = props.nodeProps.decorations.map((d)=>d.spec.name).join();
                    return /*#__PURE__*/ _react1.default.createElement("hr", {
                        ref: ref
                    });
                })
            }
        });
        const a = _prosemirrorView.Decoration.node(5, 6, {}, {
            name: "a"
        });
        (0, _react.act)(()=>{
            updateDeco(view, [
                a
            ], []);
        });
        expect(current).toBe("a");
        (0, _react.act)(()=>{
            updateDeco(view, [
                _prosemirrorView.Decoration.node(5, 6, {}, {
                    name: "b"
                }),
                _prosemirrorView.Decoration.node(5, 6, {}, {
                    name: "c"
                })
            ], [
                a
            ]);
        });
        expect(current).toBe("b,c");
    });
    it("draws the specified marks around a widget", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foobar")),
            plugins: [
                decoPlugin([
                    (0, _reactWidgetTypeJs.widget)(4, /*#__PURE__*/ (0, _react1.forwardRef)(function Img(props, ref) {
                        return /*#__PURE__*/ _react1.default.createElement("img", _extends({}, props, {
                            ref: ref
                        }));
                    }), {
                        marks: [
                            _prosemirrorTestBuilder.schema.mark("em")
                        ],
                        key: "img-widget"
                    })
                ])
            ]
        });
        expect(view.dom.querySelector("em img")).not.toBeNull();
    });
    it("draws widgets inside the marks for their side", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)((0, _prosemirrorTestBuilder.em)("foo"), (0, _prosemirrorTestBuilder.strong)("bar"))),
            plugins: [
                decoPlugin([
                    (0, _reactWidgetTypeJs.widget)(4, /*#__PURE__*/ (0, _react1.forwardRef)(function Img(props, ref) {
                        return /*#__PURE__*/ _react1.default.createElement("img", _extends({}, props, {
                            ref: ref
                        }));
                    }), {
                        side: -1,
                        key: "img-widget"
                    })
                ]),
                decoPlugin([
                    (0, _reactWidgetTypeJs.widget)(4, /*#__PURE__*/ (0, _react1.forwardRef)(function BR(props, ref) {
                        return /*#__PURE__*/ _react1.default.createElement("br", _extends({}, props, {
                            ref: ref
                        }));
                    }), {
                        key: "br-widget"
                    })
                ]),
                decoPlugin([
                    (0, _reactWidgetTypeJs.widget)(7, /*#__PURE__*/ (0, _react1.forwardRef)(function Span(props, ref) {
                        return /*#__PURE__*/ _react1.default.createElement("span", _extends({}, props, {
                            ref: ref
                        }));
                    }), {
                        side: 1,
                        key: "span-widget"
                    })
                ])
            ]
        });
        expect(view.dom.querySelector("em img")).not.toBeNull();
        expect(view.dom.querySelector("strong img")).toBeNull();
        expect(view.dom.querySelector("strong br")).not.toBeNull();
        expect(view.dom.querySelector("em br")).toBeNull();
        expect(view.dom.querySelector("strong span")).toBeNull();
    });
    it("draws decorations inside node views", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo")),
            nodeViews: {
                paragraph: /*#__PURE__*/ (0, _react1.forwardRef)(function Paragraph(param, ref) {
                    let { nodeProps , children , ...props } = param;
                    return /*#__PURE__*/ _react1.default.createElement("p", _extends({
                        ref: ref
                    }, props), children);
                })
            },
            plugins: [
                decoPlugin([
                    (0, _reactWidgetTypeJs.widget)(2, /*#__PURE__*/ (0, _react1.forwardRef)(function Img(props, ref) {
                        return /*#__PURE__*/ _react1.default.createElement("img", _extends({}, props, {
                            ref: ref
                        }));
                    }), {
                        key: "img-widget"
                    })
                ])
            ]
        });
        expect(view.dom.querySelector("img")).not.toBeNull();
    });
    it("can delay widget drawing to render time", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("hi")),
            decorations (state) {
                return _prosemirrorView.DecorationSet.create(state.doc, [
                    (0, _reactWidgetTypeJs.widget)(3, /*#__PURE__*/ (0, _react1.forwardRef)(function Span(props, ref) {
                        (0, _useEditorEffectJs.useEditorEffect)((view)=>{
                            expect(view?.state).toBe(state);
                        });
                        return /*#__PURE__*/ _react1.default.createElement("span", _extends({}, props, {
                            ref: ref
                        }), "!");
                    }), {
                        key: "span-widget"
                    })
                ]);
            }
        });
        expect(view.dom.textContent).toBe("hi!");
    });
    it("supports widgets querying their own position", ()=>{
        (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("hi")),
            decorations (state) {
                return _prosemirrorView.DecorationSet.create(state.doc, [
                    (0, _reactWidgetTypeJs.widget)(3, /*#__PURE__*/ (0, _react1.forwardRef)(function Widget(param, ref) {
                        let { pos , ...props } = param;
                        expect(pos).toBe(3);
                        return /*#__PURE__*/ _react1.default.createElement("button", _extends({
                            ref: ref
                        }, props), "ω");
                    }), {
                        key: "button-widget"
                    })
                ]);
            }
        });
    });
    it("doesn't redraw widgets with matching keys", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("hi")),
            decorations (state) {
                return _prosemirrorView.DecorationSet.create(state.doc, [
                    (0, _reactWidgetTypeJs.widget)(2, Widget, {
                        key: "myButton"
                    })
                ]);
            }
        });
        const widgetDOM = view.dom.querySelector("button");
        (0, _react.act)(()=>{
            view.dispatch(view.state.tr.insertText("!", 2, 2));
        });
        expect(view.dom.querySelector("button")).toBe(widgetDOM);
    });
    it("doesn't redraw widgets with identical specs", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("hi")),
            decorations (state) {
                return _prosemirrorView.DecorationSet.create(state.doc, [
                    (0, _reactWidgetTypeJs.widget)(2, Widget, {
                        side: 1,
                        key: "widget"
                    })
                ]);
            }
        });
        const widgetDOM = view.dom.querySelector("button");
        (0, _react.act)(()=>{
            view.dispatch(view.state.tr.insertText("!", 2, 2));
        });
        expect(view.dom.querySelector("button")).toBe(widgetDOM);
    });
    it("doesn't get confused by split text nodes", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("abab")),
            decorations (state) {
                return state.selection.from <= 1 ? null : _prosemirrorView.DecorationSet.create(view.state.doc, [
                    _prosemirrorView.Decoration.inline(1, 2, {
                        class: "foo"
                    }),
                    _prosemirrorView.Decoration.inline(3, 4, {
                        class: "foo"
                    })
                ]);
            }
        });
        (0, _react.act)(()=>{
            view.dispatch(view.state.tr.setSelection(_prosemirrorState.TextSelection.create(view.state.doc, 5)));
        });
        expect(view.dom.textContent).toBe("abab");
    });
    it("only draws inline decorations on the innermost level", ()=>{
        const s = new _prosemirrorModel.Schema({
            nodes: {
                doc: {
                    content: "(text | thing)*"
                },
                text: {},
                thing: {
                    inline: true,
                    content: "text*",
                    toDOM: ()=>[
                            "strong",
                            0
                        ],
                    parseDOM: [
                        {
                            tag: "strong"
                        }
                    ]
                }
            }
        });
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: s.node("doc", null, [
                s.text("abc"),
                s.node("thing", null, [
                    s.text("def")
                ]),
                s.text("ghi")
            ]),
            decorations: (s)=>_prosemirrorView.DecorationSet.create(s.doc, [
                    _prosemirrorView.Decoration.inline(1, 10, {
                        class: "dec"
                    })
                ])
        });
        const styled = view.dom.querySelectorAll(".dec");
        expect(styled).toHaveLength(3);
        expect(Array.prototype.map.call(styled, (n)=>n.textContent).join()).toBe("bc,def,gh");
        expect(styled[1].parentNode.nodeName).toBe("STRONG");
    });
    it("can handle nodeName decoration overlapping with classes", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("one two three")),
            plugins: [
                decoPlugin([
                    _prosemirrorView.Decoration.inline(2, 13, {
                        class: "foo"
                    }),
                    _prosemirrorView.Decoration.inline(5, 8, {
                        nodeName: "em"
                    })
                ])
            ]
        });
        expect(view.dom.firstChild.innerHTML).toBe('o<span class="foo">ne </span><em class="foo">two</em><span class="foo"> thre</span>e');
    });
    it("can handle combining decorations from parent editors in child editors", ()=>{
        let decosFromFirstEditor;
        let { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("one two three")),
            plugins: [
                decoPlugin([
                    _prosemirrorView.Decoration.inline(2, 13, {
                        class: "foo"
                    })
                ]),
                decoPlugin([
                    _prosemirrorView.Decoration.inline(2, 13, {
                        class: "bar"
                    })
                ])
            ],
            nodeViews: {
                paragraph: /*#__PURE__*/ (0, _react1.forwardRef)(function Paragraph(param, ref) {
                    let { nodeProps , children , ...props } = param;
                    decosFromFirstEditor = nodeProps.innerDecorations;
                    return /*#__PURE__*/ _react1.default.createElement("p", _extends({
                        ref: ref
                    }, props), children);
                })
            }
        });
        ({ view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("one two three")),
            plugins: [
                decoPlugin([
                    _prosemirrorView.Decoration.inline(1, 12, {
                        class: "baz"
                    })
                ])
            ],
            decorations: ()=>decosFromFirstEditor
        }));
        expect(view.dom.querySelectorAll(".foo")).toHaveLength(1);
        expect(view.dom.querySelectorAll(".bar")).toHaveLength(1);
        expect(view.dom.querySelectorAll(".baz")).toHaveLength(1);
    });
});
