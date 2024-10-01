/* eslint-disable @typescript-eslint/no-explicit-any */ /* eslint-disable @typescript-eslint/no-non-null-assertion */ // TODO: figure out whether it's possible to support native
// widgets. Right now, I'm not sure how we'd do it without
// wrapping them in another element, which would re-introduce
// all of the issues we had before with node views.
//
// For now, we've updated the factory in this file to use
// our React widgets.
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
import { Schema } from "prosemirror-model";
import { Plugin, TextSelection } from "prosemirror-state";
import { blockquote, doc, em, h1, hr, img, p, schema, strong } from "prosemirror-test-builder";
import { Decoration, DecorationSet } from "prosemirror-view";
import React, { forwardRef, useEffect } from "react";
import { widget } from "../../decorations/ReactWidgetType.js";
import { useEditorEffect } from "../../hooks/useEditorEffect.js";
import { tempEditor } from "../../testing/editorViewTestHelpers.js";
const Widget = /*#__PURE__*/ forwardRef(function Widget(param, ref) {
    let { widget , getPos , ...props } = param;
    return /*#__PURE__*/ React.createElement("button", _extends({
        ref: ref
    }, props), "ω");
});
function make(str) {
    if (typeof str != "string") return str;
    const match = /^(\d+)(?:-(\d+))?-(.+)$/.exec(str);
    if (match[3] == "widget") {
        return widget(+match[1], Widget, {
            key: str
        });
    }
    return Decoration.inline(+match[1], +match[2], {
        class: match[3]
    });
}
function decoPlugin(decos) {
    return new Plugin({
        state: {
            init (config) {
                return config.doc ? DecorationSet.create(config.doc, decos.map(make)) : DecorationSet.empty;
            },
            apply (tr, set, state) {
                if (tr.docChanged) set = set.map(tr.mapping, tr.doc);
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
    it("draws inline decorations", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foobar")),
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
    it("draws wrapping decorations", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foo")),
            plugins: [
                decoPlugin([
                    Decoration.inline(1, 5, {
                        nodeName: "i"
                    })
                ])
            ]
        });
        const found = view.dom.querySelector("i");
        expect(found && found.innerHTML).toBe("foo");
    });
    it("draws node decorations", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foo"), p("bar")),
            plugins: [
                decoPlugin([
                    Decoration.node(5, 10, {
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
    it("can update multi-level wrapping decorations", async ()=>{
        const d2 = Decoration.inline(1, 5, {
            nodeName: "i",
            class: "b"
        });
        const { view  } = tempEditor({
            doc: doc(p("hello")),
            plugins: [
                decoPlugin([
                    Decoration.inline(1, 5, {
                        nodeName: "i",
                        class: "a"
                    }),
                    d2
                ])
            ]
        });
        expect(view.dom.querySelectorAll("i")).toHaveLength(2);
        updateDeco(view, [
            Decoration.inline(1, 5, {
                nodeName: "i",
                class: "c"
            })
        ], [
            d2
        ]);
        const iNodes = view.dom.querySelectorAll("i");
        expect(iNodes).toHaveLength(2);
        expect(Array.prototype.map.call(iNodes, (n)=>n.className).sort().join()).toBe("a,c");
    });
    it("draws overlapping inline decorations", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("abcdef")),
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
    it("draws multiple widgets", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foobar")),
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
    it("orders widgets by their side option", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foobar")),
            plugins: [
                decoPlugin([
                    widget(4, /*#__PURE__*/ forwardRef(function B(props, ref) {
                        return /*#__PURE__*/ React.createElement("span", _extends({
                            ref: ref
                        }, props), "B");
                    }), {
                        key: "widget-b"
                    }),
                    widget(4, /*#__PURE__*/ forwardRef(function A(props, ref) {
                        return /*#__PURE__*/ React.createElement("span", _extends({
                            ref: ref
                        }, props), "A");
                    }), {
                        side: -100,
                        key: "widget-a"
                    }),
                    widget(4, /*#__PURE__*/ forwardRef(function C(props, ref) {
                        return /*#__PURE__*/ React.createElement("span", _extends({
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
    it("draws a widget in an empty node", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p()),
            plugins: [
                decoPlugin([
                    "1-widget"
                ])
            ]
        });
        expect(view.dom.querySelectorAll("button")).toHaveLength(1);
    });
    it("draws widgets on node boundaries", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foo", em("bar"))),
            plugins: [
                decoPlugin([
                    "4-widget"
                ])
            ]
        });
        expect(view.dom.querySelectorAll("button")).toHaveLength(1);
    });
    it("draws decorations from multiple plugins", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foo", em("bar"))),
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
    it("calls widget destroy methods", async ()=>{
        let destroyed = false;
        const DestroyableWidget = /*#__PURE__*/ forwardRef(function DestroyableWidget(props, ref) {
            useEffect(()=>{
                destroyed = true;
            });
            return /*#__PURE__*/ React.createElement("button", _extends({
                ref: ref
            }, props));
        });
        const { view  } = tempEditor({
            doc: doc(p("abc")),
            plugins: [
                decoPlugin([
                    widget(2, DestroyableWidget, {
                        key: "destroyable-widget"
                    })
                ])
            ]
        });
        view.dispatch(view.state.tr.delete(1, 4));
        expect(destroyed).toBeTruthy();
    });
    it("draws inline decorations spanning multiple parents", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("long first ", em("p"), "aragraph"), p("two")),
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
    it("draws inline decorations across empty paragraphs", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("first"), p(), p("second")),
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
    it("can handle inline decorations ending at the start or end of a node", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p(), p()),
            plugins: [
                decoPlugin([
                    "1-3-foo"
                ])
            ]
        });
        expect(view.dom.querySelector(".foo")).toBeNull();
    });
    it("can draw decorations with multiple classes", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foo")),
            plugins: [
                decoPlugin([
                    "1-4-foo bar"
                ])
            ]
        });
        expect(view.dom.querySelectorAll(".foo")).toHaveLength(1);
        expect(view.dom.querySelectorAll(".bar")).toHaveLength(1);
    });
    it("supports overlapping inline decorations", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foobar")),
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
    it("doesn't redraw when irrelevant decorations change", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foo"), p("baz")),
            plugins: [
                decoPlugin([
                    "7-8-foo"
                ])
            ]
        });
        const para2 = view.dom.lastChild;
        updateDeco(view, [
            make("2-3-bar")
        ]);
        expect(view.dom.lastChild).toBe(para2);
        expect(view.dom.querySelector(".bar")).not.toBeNull();
    });
    it("doesn't redraw when irrelevant content changes", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foo"), p("baz")),
            plugins: [
                decoPlugin([
                    "7-8-foo"
                ])
            ]
        });
        const para2 = view.dom.lastChild;
        view.dispatch(view.state.tr.delete(2, 3));
        view.dispatch(view.state.tr.delete(2, 3));
        expect(view.dom.lastChild).toBe(para2);
    });
    it("can add a widget on a node boundary", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foo", em("bar"))),
            plugins: [
                decoPlugin([])
            ]
        });
        updateDeco(view, [
            make("4-widget")
        ]);
        expect(view.dom.querySelectorAll("button")).toHaveLength(1);
    });
    it("can remove a widget on a node boundary", async ()=>{
        const dec = make("4-widget");
        const { view  } = tempEditor({
            doc: doc(p("foo", em("bar"))),
            plugins: [
                decoPlugin([
                    dec
                ])
            ]
        });
        updateDeco(view, null, [
            dec
        ]);
        expect(view.dom.querySelector("button")).toBeNull();
    });
    it("can remove the class from a text node", async ()=>{
        const dec = make("1-4-foo");
        const { view  } = tempEditor({
            doc: doc(p("abc")),
            plugins: [
                decoPlugin([
                    dec
                ])
            ]
        });
        expect(view.dom.querySelector(".foo")).not.toBeNull();
        updateDeco(view, null, [
            dec
        ]);
        expect(view.dom.querySelector(".foo")).toBeNull();
    });
    it("can remove the class from part of a text node", async ()=>{
        const dec = make("2-4-foo");
        const { view  } = tempEditor({
            doc: doc(p("abcd")),
            plugins: [
                decoPlugin([
                    dec
                ])
            ]
        });
        expect(view.dom.querySelector(".foo")).not.toBeNull();
        updateDeco(view, null, [
            dec
        ]);
        expect(view.dom.querySelector(".foo")).toBeNull();
        expect(view.dom.firstChild.innerHTML).toBe("abcd");
    });
    it("can change the class for part of a text node", async ()=>{
        const dec = make("2-4-foo");
        const { view  } = tempEditor({
            doc: doc(p("abcd")),
            plugins: [
                decoPlugin([
                    dec
                ])
            ]
        });
        expect(view.dom.querySelector(".foo")).not.toBeNull();
        updateDeco(view, [
            make("2-4-bar")
        ], [
            dec
        ]);
        expect(view.dom.querySelector(".foo")).toBeNull();
        expect(view.dom.querySelector(".bar")).not.toBeNull();
    });
    it("draws a widget added in the middle of a text node", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foo")),
            plugins: [
                decoPlugin([])
            ]
        });
        updateDeco(view, [
            make("3-widget")
        ]);
        expect(view.dom.firstChild.textContent).toBe("foωo");
    });
    it("can update a text node around a widget", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("bar")),
            plugins: [
                decoPlugin([
                    "3-widget"
                ])
            ]
        });
        view.dispatch(view.state.tr.delete(1, 2));
        expect(view.dom.querySelectorAll("button")).toHaveLength(1);
        expect(view.dom.firstChild.textContent).toBe("aωr");
    });
    it("can update a text node with an inline decoration", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("bar")),
            plugins: [
                decoPlugin([
                    "1-3-foo"
                ])
            ]
        });
        view.dispatch(view.state.tr.delete(1, 2));
        const foo = view.dom.querySelector(".foo");
        expect(foo).not.toBeNull();
        expect(foo.textContent).toBe("a");
        expect(foo.nextSibling.textContent).toBe("r");
    });
    it("correctly redraws a partially decorated node when a widget is added", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("one", em("two"))),
            plugins: [
                decoPlugin([
                    "1-6-foo"
                ])
            ]
        });
        updateDeco(view, [
            make("6-widget")
        ]);
        const foos = view.dom.querySelectorAll(".foo");
        expect(foos).toHaveLength(2);
        expect(foos[0].textContent).toBe("one");
        expect(foos[1].textContent).toBe("tw");
    });
    it("correctly redraws when skipping split text node", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foo")),
            plugins: [
                decoPlugin([
                    "3-widget",
                    "3-4-foo"
                ])
            ]
        });
        updateDeco(view, [
            make("4-widget")
        ]);
        expect(view.dom.querySelectorAll("button")).toHaveLength(2);
    });
    it("drops removed node decorations from the view", async ()=>{
        const deco = Decoration.node(1, 6, {
            class: "cls"
        });
        const { view  } = tempEditor({
            doc: doc(blockquote(p("foo"), p("bar"))),
            plugins: [
                decoPlugin([
                    deco
                ])
            ]
        });
        updateDeco(view, null, [
            deco
        ]);
        expect(view.dom.querySelector(".cls")).toBeNull();
    });
    it("can update a node's attributes without replacing the node", async ()=>{
        const deco = Decoration.node(0, 5, {
            title: "title",
            class: "foo"
        });
        const { view  } = tempEditor({
            doc: doc(p("foo")),
            plugins: [
                decoPlugin([
                    deco
                ])
            ]
        });
        const para = view.dom.querySelector("p");
        updateDeco(view, [
            Decoration.node(0, 5, {
                class: "foo bar"
            })
        ], [
            deco
        ]);
        expect(view.dom.querySelector("p")).toBe(para);
        expect(para.className).toBe("foo bar");
        expect(para.title).toBeFalsy();
    });
    it("can add and remove CSS custom properties from a node", async ()=>{
        const deco = Decoration.node(0, 5, {
            style: "--my-custom-property:36px"
        });
        const { view  } = tempEditor({
            doc: doc(p("foo")),
            plugins: [
                decoPlugin([
                    deco
                ])
            ]
        });
        expect(view.dom.querySelector("p").style.getPropertyValue("--my-custom-property")).toBe("36px");
        updateDeco(view, null, [
            deco
        ]);
        expect(view.dom.querySelector("p").style.getPropertyValue("--my-custom-property")).toBe("");
    });
    it("updates decorated nodes even if a widget is added before them", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("a"), p("b")),
            plugins: [
                decoPlugin([])
            ]
        });
        const lastP = view.dom.querySelectorAll("p")[1];
        updateDeco(view, [
            make("3-widget"),
            Decoration.node(3, 6, {
                style: "color: red"
            })
        ]);
        expect(lastP.style.color).toBe("red");
    });
    it("doesn't redraw nodes when a widget before them is replaced", async ()=>{
        const w0 = make("3-widget");
        const { view  } = tempEditor({
            doc: doc(h1("a"), p("b")),
            plugins: [
                decoPlugin([
                    w0
                ])
            ]
        });
        const initialP = view.dom.querySelector("p");
        view.dispatch(view.state.tr.setMeta("updateDecorations", {
            add: [
                make("3-widget")
            ],
            remove: [
                w0
            ]
        }).insertText("c", 5));
        expect(view.dom.querySelector("p")).toBe(initialP);
    });
    it("can add and remove inline style", async ()=>{
        const deco = Decoration.inline(1, 6, {
            style: "color: rgba(0,10,200,.4); text-decoration: underline"
        });
        const { view  } = tempEditor({
            doc: doc(p("al", img(), "lo")),
            plugins: [
                decoPlugin([
                    deco
                ])
            ]
        });
        expect(view.dom.querySelector("img").style.color).toMatch(/rgba/);
        expect(view.dom.querySelector("img").previousSibling.style.textDecoration).toBe("underline");
        updateDeco(view, null, [
            deco
        ]);
        expect(view.dom.querySelector("img").style.color).toBe("");
        expect(view.dom.querySelector("img").style.textDecoration).toBe("");
    });
    it("passes decorations to a node view", async ()=>{
        let current = "";
        const { view  } = tempEditor({
            doc: doc(p("foo"), hr()),
            plugins: [
                decoPlugin([])
            ],
            nodeViews: {
                horizontal_rule: /*#__PURE__*/ forwardRef(function HR(param, ref) {
                    let { nodeProps , children , ...props } = param;
                    current = nodeProps.decorations.map((d)=>d.spec.name).join();
                    return /*#__PURE__*/ React.createElement("hr", _extends({
                        ref: ref
                    }, props));
                })
            }
        });
        const a = Decoration.node(5, 6, {}, {
            name: "a"
        });
        updateDeco(view, [
            a
        ], []);
        expect(current).toBe("a");
        updateDeco(view, [
            Decoration.node(5, 6, {}, {
                name: "b"
            }),
            Decoration.node(5, 6, {}, {
                name: "c"
            })
        ], [
            a
        ]);
        expect(current).toBe("b,c");
    });
    it("draws the specified marks around a widget", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foobar")),
            plugins: [
                decoPlugin([
                    widget(4, /*#__PURE__*/ forwardRef(function Img(props, ref) {
                        return /*#__PURE__*/ React.createElement("img", _extends({}, props, {
                            ref: ref
                        }));
                    }), {
                        marks: [
                            schema.mark("em")
                        ],
                        key: "img-widget"
                    })
                ])
            ]
        });
        expect(view.dom.querySelector("em img")).not.toBeNull();
    });
    it("draws widgets inside the marks for their side", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p(em("foo"), strong("bar"))),
            plugins: [
                decoPlugin([
                    widget(4, /*#__PURE__*/ forwardRef(function Img(props, ref) {
                        return /*#__PURE__*/ React.createElement("img", _extends({}, props, {
                            ref: ref
                        }));
                    }), {
                        side: -1,
                        key: "img-widget"
                    })
                ]),
                decoPlugin([
                    widget(4, /*#__PURE__*/ forwardRef(function BR(props, ref) {
                        return /*#__PURE__*/ React.createElement("br", _extends({}, props, {
                            ref: ref
                        }));
                    }), {
                        key: "br-widget"
                    })
                ]),
                decoPlugin([
                    widget(7, /*#__PURE__*/ forwardRef(function Span(param, ref) {
                        let { widget , getPos , ...props } = param;
                        return /*#__PURE__*/ React.createElement("span", _extends({}, props, {
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
    it("draws decorations inside node views", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foo")),
            nodeViews: {
                paragraph: /*#__PURE__*/ forwardRef(function Paragraph(param, ref) {
                    let { nodeProps , children , ...props } = param;
                    return /*#__PURE__*/ React.createElement("p", _extends({
                        ref: ref
                    }, props), children);
                })
            },
            plugins: [
                decoPlugin([
                    widget(2, /*#__PURE__*/ forwardRef(function Img(props, ref) {
                        return /*#__PURE__*/ React.createElement("img", _extends({}, props, {
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
    it("can delay widget drawing to render time", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("hi")),
            decorations (state) {
                return DecorationSet.create(state.doc, [
                    widget(3, /*#__PURE__*/ forwardRef(function Span(props, ref) {
                        useEditorEffect((view)=>{
                            expect(view.state).toBe(state);
                        });
                        return /*#__PURE__*/ React.createElement("span", _extends({}, props, {
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
    it("supports widgets querying their own position", async ()=>{
        tempEditor({
            doc: doc(p("hi")),
            decorations (state) {
                return DecorationSet.create(state.doc, [
                    widget(3, /*#__PURE__*/ forwardRef(function Widget(param, ref) {
                        let { getPos , ...props } = param;
                        expect(getPos()).toBe(3);
                        return /*#__PURE__*/ React.createElement("button", _extends({
                            ref: ref
                        }, props), "ω");
                    }), {
                        key: "button-widget"
                    })
                ]);
            }
        });
    });
    it("doesn't redraw widgets with matching keys", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("hi")),
            decorations (state) {
                return DecorationSet.create(state.doc, [
                    widget(2, Widget, {
                        key: "myButton"
                    })
                ]);
            }
        });
        const widgetDOM = view.dom.querySelector("button");
        view.dispatch(view.state.tr.insertText("!", 2, 2));
        expect(view.dom.querySelector("button")).toBe(widgetDOM);
    });
    it("doesn't redraw widgets with identical specs", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("hi")),
            decorations (state) {
                return DecorationSet.create(state.doc, [
                    widget(2, Widget, {
                        side: 1,
                        key: "widget"
                    })
                ]);
            }
        });
        const widgetDOM = view.dom.querySelector("button");
        view.dispatch(view.state.tr.insertText("!", 2, 2));
        expect(view.dom.querySelector("button")).toBe(widgetDOM);
    });
    it("doesn't get confused by split text nodes", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("abab")),
            decorations (state) {
                return state.selection.from <= 1 ? null : DecorationSet.create(view.state.doc, [
                    Decoration.inline(1, 2, {
                        class: "foo"
                    }),
                    Decoration.inline(3, 4, {
                        class: "foo"
                    })
                ]);
            }
        });
        view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 5)));
        expect(view.dom.textContent).toBe("abab");
    });
    it("only draws inline decorations on the innermost level", async ()=>{
        const s = new Schema({
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
        const { view  } = tempEditor({
            doc: s.node("doc", null, [
                s.text("abc"),
                s.node("thing", null, [
                    s.text("def")
                ]),
                s.text("ghi")
            ]),
            decorations: (s)=>DecorationSet.create(s.doc, [
                    Decoration.inline(1, 10, {
                        class: "dec"
                    })
                ])
        });
        const styled = view.dom.querySelectorAll(".dec");
        expect(styled).toHaveLength(3);
        expect(Array.prototype.map.call(styled, (n)=>n.textContent).join()).toBe("bc,def,gh");
        expect(styled[1].parentNode.nodeName).toBe("STRONG");
    });
    it("can handle nodeName decoration overlapping with classes", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("one two three")),
            plugins: [
                decoPlugin([
                    Decoration.inline(2, 13, {
                        class: "foo"
                    }),
                    Decoration.inline(5, 8, {
                        nodeName: "em"
                    })
                ])
            ]
        });
        expect(view.dom.firstChild.innerHTML).toBe('o<span class="foo">ne </span><em class="foo">two</em><span class="foo"> thre</span>e');
    });
    it("can handle combining decorations from parent editors in child editors", async ()=>{
        let decosFromFirstEditor;
        let { view  } = tempEditor({
            doc: doc(p("one two three")),
            plugins: [
                decoPlugin([
                    Decoration.inline(2, 13, {
                        class: "foo"
                    })
                ]),
                decoPlugin([
                    Decoration.inline(2, 13, {
                        class: "bar"
                    })
                ])
            ],
            nodeViews: {
                paragraph: /*#__PURE__*/ forwardRef(function Paragraph(param, ref) {
                    let { nodeProps , children , ...props } = param;
                    decosFromFirstEditor = nodeProps.innerDecorations;
                    return /*#__PURE__*/ React.createElement("p", _extends({
                        ref: ref
                    }, props), children);
                })
            }
        });
        ({ view  } = tempEditor({
            doc: doc(p("one two three")),
            plugins: [
                decoPlugin([
                    Decoration.inline(1, 12, {
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
