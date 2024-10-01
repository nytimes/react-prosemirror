/* eslint-disable @typescript-eslint/no-non-null-assertion */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _prosemirrorModel = require("prosemirror-model");
const _prosemirrorState = require("prosemirror-state");
const _prosemirrorTestBuilder = require("prosemirror-test-builder");
const _react = /*#__PURE__*/ _interopRequireWildcard(require("react"));
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
describe("EditorView draw", ()=>{
    it("updates the DOM", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo"))
        });
        view.dispatch(view.state.tr.insertText("bar"));
        expect(view.dom.textContent).toBe("barfoo");
    });
    it("doesn't redraw nodes after changes", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.h1)("foo<a>"), (0, _prosemirrorTestBuilder.p)("bar"))
        });
        const oldP = view.dom.querySelector("p");
        view.dispatch(view.state.tr.insertText("!"));
        expect(view.dom.querySelector("p")).toBe(oldP);
    });
    it("doesn't redraw nodes before changes", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo"), (0, _prosemirrorTestBuilder.h1)("bar"))
        });
        const oldP = view.dom.querySelector("p");
        view.dispatch(view.state.tr.insertText("!", 2));
        expect(view.dom.querySelector("p")).toBe(oldP);
    });
    it("doesn't redraw nodes between changes", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo"), (0, _prosemirrorTestBuilder.h1)("bar"), (0, _prosemirrorTestBuilder.pre)("baz"))
        });
        const oldP = view.dom.querySelector("p");
        const oldPre = view.dom.querySelector("pre");
        view.dispatch(view.state.tr.insertText("!", 2));
        expect(view.dom.querySelector("p")).toBe(oldP);
        expect(view.dom.querySelector("pre")).toBe(oldPre);
    });
    it("doesn't redraw siblings of a split node", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo"), (0, _prosemirrorTestBuilder.h1)("bar"), (0, _prosemirrorTestBuilder.pre)("baz"))
        });
        const oldP = view.dom.querySelector("p");
        const oldPre = view.dom.querySelector("pre");
        view.dispatch(view.state.tr.split(8));
        expect(view.dom.querySelector("p")).toBe(oldP);
        expect(view.dom.querySelector("pre")).toBe(oldPre);
    });
    it("doesn't redraw siblings of a joined node", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo"), (0, _prosemirrorTestBuilder.h1)("bar"), (0, _prosemirrorTestBuilder.h1)("x"), (0, _prosemirrorTestBuilder.pre)("baz"))
        });
        const oldP = view.dom.querySelector("p");
        const oldPre = view.dom.querySelector("pre");
        view.dispatch(view.state.tr.join(10));
        expect(view.dom.querySelector("p")).toBe(oldP);
        expect(view.dom.querySelector("pre")).toBe(oldPre);
    });
    it("doesn't redraw after a big deletion", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)(), (0, _prosemirrorTestBuilder.p)(), (0, _prosemirrorTestBuilder.p)(), (0, _prosemirrorTestBuilder.p)(), (0, _prosemirrorTestBuilder.p)(), (0, _prosemirrorTestBuilder.p)(), (0, _prosemirrorTestBuilder.p)(), (0, _prosemirrorTestBuilder.p)(), (0, _prosemirrorTestBuilder.h1)("!"), (0, _prosemirrorTestBuilder.p)(), (0, _prosemirrorTestBuilder.p)())
        });
        const oldH = view.dom.querySelector("h1");
        view.dispatch(view.state.tr.delete(2, 14));
        expect(view.dom.querySelector("h1")).toBe(oldH);
    });
    it("adds classes from the attributes prop", async ()=>{
        const { view , rerender  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)()),
            attributes: {
                class: "foo bar"
            }
        });
        expect(view.dom.classList.contains("foo")).toBeTruthy();
        expect(view.dom.classList.contains("bar")).toBeTruthy();
        expect(view.dom.classList.contains("ProseMirror")).toBeTruthy();
        rerender({
            attributes: {
                class: "baz"
            }
        });
        expect(!view.dom.classList.contains("foo")).toBeTruthy();
        expect(view.dom.classList.contains("baz")).toBeTruthy();
    });
    it("adds style from the attributes prop", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)()),
            attributes: {
                style: "border: 1px solid red;"
            },
            plugins: [
                new _prosemirrorState.Plugin({
                    props: {
                        attributes: {
                            style: "background: red;"
                        }
                    }
                }),
                new _prosemirrorState.Plugin({
                    props: {
                        attributes: {
                            style: "color: red;"
                        }
                    }
                })
            ]
        });
        expect(view.dom.style.border).toBe("1px solid red");
        expect(view.dom.style.backgroundColor).toBe("red");
        expect(view.dom.style.color).toBe("red");
    });
    it("can set other attributes", async ()=>{
        const { view , rerender  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)()),
            attributes: {
                spellcheck: "false",
                "aria-label": "hello"
            }
        });
        expect(view.dom.spellcheck).toBe(false);
        expect(view.dom.getAttribute("aria-label")).toBe("hello");
        rerender({
            attributes: {
                style: "background-color: yellow"
            }
        });
        expect(view.dom.hasAttribute("aria-label")).toBe(false);
        expect(view.dom.style.backgroundColor).toBe("yellow");
    });
    it("can't set the contenteditable attribute", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)()),
            attributes: {
                contenteditable: "false"
            }
        });
        expect(view.dom.contentEditable).toBe("true");
    });
    it("understands the editable prop", async ()=>{
        const { view , rerender  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)()),
            editable: ()=>false
        });
        expect(view.dom.contentEditable).toBe("false");
        rerender({
            editable: ()=>true
        });
        expect(view.dom.contentEditable).toBe("true");
    });
    it("doesn't redraw following paragraphs when a paragraph is split", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("abcde"), (0, _prosemirrorTestBuilder.p)("fg"))
        });
        const lastPara = view.dom.lastChild;
        view.dispatch(view.state.tr.split(3));
        expect(view.dom.lastChild).toBe(lastPara);
    });
    it("doesn't greedily match nodes that have another match", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("a"), (0, _prosemirrorTestBuilder.p)("b"), (0, _prosemirrorTestBuilder.p)())
        });
        const secondPara = view.dom.querySelectorAll("p")[1];
        view.dispatch(view.state.tr.split(2));
        expect(view.dom.querySelectorAll("p")[2]).toBe(secondPara);
    });
    it("creates and destroys plugin views", async ()=>{
        const events = [];
        let PluginView = class PluginView {
            update() {
                events.push("update");
            }
            destroy() {
                events.push("destroy");
            }
        };
        const plugin = new _prosemirrorState.Plugin({
            view () {
                events.push("create");
                return new PluginView();
            }
        });
        const { view , unmount  } = (0, _editorViewTestHelpersJs.tempEditor)({
            plugins: [
                plugin
            ]
        });
        view.dispatch(view.state.tr.insertText("u"));
        unmount();
        expect(events.join(" ")).toBe("create update destroy");
    });
    it("redraws changed node views", async ()=>{
        const { view , rerender  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo"), (0, _prosemirrorTestBuilder.hr)())
        });
        expect(view.dom.querySelector("hr")).toBeTruthy();
        rerender({
            nodeViews: {
                horizontal_rule: /*#__PURE__*/ (0, _react.forwardRef)(function HorizontalRule(param, ref) {
                    let { nodeProps , ...props } = param;
                    return /*#__PURE__*/ _react.default.createElement("var", _extends({
                        ref: ref
                    }, props));
                })
            }
        });
        expect(!view.dom.querySelector("hr")).toBeTruthy();
        expect(view.dom.querySelector("var")).toBeTruthy();
    });
    it("doesn't get confused by merged nodes", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)((0, _prosemirrorTestBuilder.strong)("one"), " two ", (0, _prosemirrorTestBuilder.strong)("three")))
        });
        view.dispatch(view.state.tr.removeMark(1, 4, _prosemirrorTestBuilder.schema.marks.strong));
        expect(view.dom.querySelectorAll("strong")).toHaveLength(1);
    });
    it("doesn't redraw too much when marks are present", async ()=>{
        const s = new _prosemirrorModel.Schema({
            nodes: {
                doc: {
                    content: "paragraph+",
                    marks: "m"
                },
                text: {
                    group: "inline"
                },
                paragraph: _prosemirrorTestBuilder.schema.spec.nodes.get("paragraph")
            },
            marks: {
                m: {
                    toDOM: ()=>[
                            "div",
                            {
                                class: "m"
                            },
                            0
                        ],
                    parseDOM: [
                        {
                            tag: "div.m"
                        }
                    ]
                }
            }
        });
        const paragraphs = [];
        for(let i = 1; i <= 10; i++)paragraphs.push(s.node("paragraph", null, [
            s.text("para " + i)
        ], [
            s.mark("m")
        ]));
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            // @ts-expect-error this is fine
            doc: s.node("doc", null, paragraphs)
        });
        const initialChildren = Array.from(view.dom.querySelectorAll("p"));
        const newParagraphs = [];
        for(let i = -6; i < 0; i++)newParagraphs.push(s.node("paragraph", null, [
            s.text("para " + i)
        ], [
            s.mark("m")
        ]));
        view.dispatch(view.state.tr.replaceWith(0, 8, newParagraphs));
        const currentChildren = Array.from(view.dom.querySelectorAll("p"));
        let sameAtEnd = 0;
        while(sameAtEnd < currentChildren.length && sameAtEnd < initialChildren.length && currentChildren[currentChildren.length - sameAtEnd - 1] == initialChildren[initialChildren.length - sameAtEnd - 1])sameAtEnd++;
        expect(sameAtEnd).toBe(9);
    });
});
