/* eslint-disable @typescript-eslint/no-explicit-any */ /* eslint-disable @typescript-eslint/no-non-null-assertion */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _react = require("@testing-library/react");
const _prosemirrorState = require("prosemirror-state");
const _prosemirrorTestBuilder = require("prosemirror-test-builder");
const _prosemirrorView = require("prosemirror-view");
const _react1 = /*#__PURE__*/ _interopRequireWildcard(require("react"));
const _useEditorStateJs = require("../../hooks/useEditorState.js");
const _useStopEventJs = require("../../hooks/useStopEvent.js");
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
describe("nodeViews prop", ()=>{
    it("can replace a node's representation", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo", (0, _prosemirrorTestBuilder.br)())),
            nodeViews: {
                hard_break: /*#__PURE__*/ (0, _react1.forwardRef)(function Var(props, ref) {
                    return /*#__PURE__*/ _react1.default.createElement("var", {
                        ref: ref
                    }, props.children);
                })
            }
        });
        expect(view.dom.querySelector("var")).not.toBeNull();
    });
    it("can override drawing of a node's content", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo")),
            nodeViews: {
                paragraph: /*#__PURE__*/ (0, _react1.forwardRef)(function Paragraph(props, ref) {
                    return /*#__PURE__*/ _react1.default.createElement("p", {
                        ref: ref
                    }, props.nodeProps.node.textContent.toUpperCase());
                })
            }
        });
        expect(view.dom.querySelector("p").textContent).toBe("FOO");
        view.dispatch(view.state.tr.insertText("a"));
        expect(view.dom.querySelector("p").textContent).toBe("AFOO");
    });
    // React makes this more or less trivial; the render
    // method of the component _is_ the update (and create)
    // method
    // eslint-disable-next-line jest/no-disabled-tests
    it.skip("can register its own update method", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo")),
            nodeViews: {
                paragraph: /*#__PURE__*/ (0, _react1.forwardRef)(function Paragraph(props, ref) {
                    return /*#__PURE__*/ _react1.default.createElement("p", {
                        ref: ref
                    }, props.nodeProps.node.textContent.toUpperCase());
                })
            }
        });
        const para = view.dom.querySelector("p");
        view.dispatch(view.state.tr.insertText("a"));
        expect(view.dom.querySelector("p")).toBe(para);
        expect(para.textContent).toBe("AFOO");
    });
    it("allows decoration updates for node views with an update method", async ()=>{
        const { view , rerender  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo")),
            nodeViews: {
                paragraph: /*#__PURE__*/ (0, _react1.forwardRef)(function Paragraph(param, ref) {
                    let { children , nodeProps , ...props } = param;
                    return /*#__PURE__*/ _react1.default.createElement("p", _extends({
                        ref: ref
                    }, props), children);
                })
            }
        });
        rerender({
            decorations (state) {
                return _prosemirrorView.DecorationSet.create(state.doc, [
                    _prosemirrorView.Decoration.inline(2, 3, {
                        someattr: "ok"
                    }),
                    _prosemirrorView.Decoration.node(0, 5, {
                        otherattr: "ok"
                    })
                ]);
            }
        });
        expect(view.dom.querySelector("[someattr]")).not.toBeNull();
        expect(view.dom.querySelector("[otherattr]")).not.toBeNull();
    });
    it("can provide a contentDOM property", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo")),
            nodeViews: {
                paragraph: /*#__PURE__*/ (0, _react1.forwardRef)(function Paragraph(props, ref) {
                    return(// ContentDOM is inferred from where props.children is rendered
                    /*#__PURE__*/ _react1.default.createElement("p", {
                        ref: ref
                    }, props.children));
                })
            }
        });
        const para = view.dom.querySelector("p");
        view.dispatch(view.state.tr.insertText("a"));
        expect(view.dom.querySelector("p")).toBe(para);
        expect(para.textContent).toBe("afoo");
    });
    it("has its destroy method called", async ()=>{
        let destroyed = false;
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo", (0, _prosemirrorTestBuilder.br)())),
            nodeViews: {
                hard_break: /*#__PURE__*/ (0, _react1.forwardRef)(function BR(_props, ref) {
                    // React implements "destroy methods" with effect
                    // hooks
                    (0, _react1.useEffect)(()=>{
                        return ()=>{
                            destroyed = true;
                        };
                    }, []);
                    return /*#__PURE__*/ _react1.default.createElement("br", {
                        ref: ref
                    });
                })
            }
        });
        expect(destroyed).toBeFalsy();
        view.dispatch(view.state.tr.delete(3, 5));
        expect(destroyed).toBeTruthy();
    });
    it("can query its own position", async ()=>{
        let pos;
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.blockquote)((0, _prosemirrorTestBuilder.p)("abc"), (0, _prosemirrorTestBuilder.p)("foo", (0, _prosemirrorTestBuilder.br)()))),
            nodeViews: {
                hard_break: /*#__PURE__*/ (0, _react1.forwardRef)(function BR(param, ref) {
                    let { nodeProps , children , ...props } = param;
                    // trigger a re-render on every updated, otherwise we won't
                    // re-render when an updated doesn't directly affect us
                    (0, _useEditorStateJs.useEditorState)();
                    pos = nodeProps.getPos();
                    return /*#__PURE__*/ _react1.default.createElement("br", _extends({
                        ref: ref
                    }, props));
                })
            }
        });
        expect(pos).toBe(10);
        view.dispatch(view.state.tr.insertText("a"));
        expect(pos).toBe(11);
    });
    it("has access to outer decorations", async ()=>{
        const plugin = new _prosemirrorState.Plugin({
            state: {
                init () {
                    return null;
                },
                apply (tr, prev) {
                    return tr.getMeta("setDeco") || prev;
                }
            },
            props: {
                decorations (state) {
                    const deco = this.getState(state);
                    return deco && _prosemirrorView.DecorationSet.create(state.doc, [
                        _prosemirrorView.Decoration.inline(0, state.doc.content.size, {}, {
                            name: deco
                        })
                    ]);
                }
            }
        });
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo", (0, _prosemirrorTestBuilder.br)())),
            plugins: [
                plugin
            ],
            nodeViews: {
                hard_break: /*#__PURE__*/ (0, _react1.forwardRef)(function Var(props, ref) {
                    return /*#__PURE__*/ _react1.default.createElement("var", {
                        ref: ref
                    }, props.nodeProps.decorations.length ? props.nodeProps.decorations[0].spec.name : "[]");
                })
            }
        });
        expect(view.dom.querySelector("var").textContent).toBe("[]");
        view.dispatch(view.state.tr.setMeta("setDeco", "foo"));
        expect(view.dom.querySelector("var").textContent).toBe("foo");
        view.dispatch(view.state.tr.setMeta("setDeco", "bar"));
        expect(view.dom.querySelector("var").textContent).toBe("bar");
    });
    it("provides access to inner decorations in the constructor", async ()=>{
        (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo")),
            nodeViews: {
                paragraph: /*#__PURE__*/ (0, _react1.forwardRef)(function Paragraph(props, ref) {
                    expect(props.nodeProps.innerDecorations.find().map((d)=>`${d.from}-${d.to}`).join()).toBe("1-2");
                    return /*#__PURE__*/ _react1.default.createElement("p", {
                        ref: ref
                    }, props.children);
                })
            },
            decorations (state) {
                return _prosemirrorView.DecorationSet.create(state.doc, [
                    _prosemirrorView.Decoration.inline(2, 3, {
                        someattr: "ok"
                    }),
                    _prosemirrorView.Decoration.node(0, 5, {
                        otherattr: "ok"
                    })
                ]);
            }
        });
    });
    it("provides access to inner decorations in the update method", async ()=>{
        let innerDecos = [];
        const { rerender  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo")),
            nodeViews: {
                paragraph: /*#__PURE__*/ (0, _react1.forwardRef)(function Paragraph(props, ref) {
                    innerDecos = props.nodeProps.innerDecorations.find().map((d)=>`${d.from}-${d.to}`);
                    return /*#__PURE__*/ _react1.default.createElement("p", {
                        ref: ref
                    }, props.children);
                })
            }
        });
        rerender({
            decorations (state) {
                return _prosemirrorView.DecorationSet.create(state.doc, [
                    _prosemirrorView.Decoration.inline(2, 3, {
                        someattr: "ok"
                    }),
                    _prosemirrorView.Decoration.node(0, 5, {
                        otherattr: "ok"
                    })
                ]);
            }
        });
        expect(innerDecos.join()).toBe("1-2");
    });
    it("can provide a stopEvent hook", async ()=>{
        (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("input value")),
            nodeViews: {
                paragraph: /*#__PURE__*/ (0, _react1.forwardRef)(function ParagraphInput(param, ref) {
                    let { nodeProps , children , ...props } = param;
                    (0, _useStopEventJs.useStopEvent)(()=>{
                        return true;
                    });
                    return /*#__PURE__*/ _react1.default.createElement("input", _extends({
                        ref: ref,
                        type: "text",
                        defaultValue: nodeProps.node.textContent
                    }, props));
                })
            }
        });
        const input = _react.screen.getByDisplayValue("input value");
        input.focus();
        await browser.keys("z");
        expect(await $(input).getValue()).toBe("input valuez");
    });
});
