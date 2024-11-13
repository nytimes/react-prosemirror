/* eslint-disable @typescript-eslint/no-explicit-any */ /* eslint-disable @typescript-eslint/no-non-null-assertion */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _react = require("@testing-library/react");
const _prosemirrorModel = require("prosemirror-model");
const _prosemirrorState = require("prosemirror-state");
const _prosemirrorTestBuilder = require("prosemirror-test-builder");
const _react1 = /*#__PURE__*/ _interopRequireWildcard(require("react"));
const _useEditorEffectJs = require("../../hooks/useEditorEffect.js");
const _useStopEventJs = require("../../hooks/useStopEvent.js");
const _reactKeysJs = require("../../plugins/reactKeys.js");
const _editorViewTestHelpersJs = require("../../testing/editorViewTestHelpers.js");
const _proseMirrorJs = require("../ProseMirror.js");
const _proseMirrorDocJs = require("../ProseMirrorDoc.js");
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
describe("ProseMirror", ()=>{
    it("renders a contenteditable", async ()=>{
        const schema = new _prosemirrorModel.Schema({
            nodes: {
                text: {},
                doc: {
                    content: "text*"
                }
            }
        });
        const editorState = _prosemirrorState.EditorState.create({
            schema
        });
        function TestEditor() {
            return /*#__PURE__*/ _react1.default.createElement(_proseMirrorJs.ProseMirror, {
                defaultState: editorState
            }, /*#__PURE__*/ _react1.default.createElement(_proseMirrorDocJs.ProseMirrorDoc, {
                "data-testid": "editor"
            }));
        }
        (0, _react.render)(/*#__PURE__*/ _react1.default.createElement(TestEditor, null));
        const editor = _react.screen.getByTestId("editor");
        editor.focus();
        await browser.keys("H");
        await browser.keys("e");
        await browser.keys("l");
        await browser.keys("l");
        await browser.keys("o");
        await browser.keys(",");
        await browser.keys(" ");
        await browser.keys("w");
        await browser.keys("o");
        await browser.keys("r");
        await browser.keys("l");
        await browser.keys("d");
        await browser.keys("!");
        expect(editor.textContent).toBe("Hello, world!");
    });
    it("supports lifted editor state", async ()=>{
        const schema = new _prosemirrorModel.Schema({
            nodes: {
                text: {},
                doc: {
                    content: "text*"
                }
            }
        });
        let outerEditorState = _prosemirrorState.EditorState.create({
            schema
        });
        function TestEditor() {
            const [editorState, setEditorState] = (0, _react1.useState)(outerEditorState);
            (0, _react1.useEffect)(()=>{
                outerEditorState = editorState;
            }, [
                editorState
            ]);
            return /*#__PURE__*/ _react1.default.createElement(_proseMirrorJs.ProseMirror, {
                state: editorState,
                dispatchTransaction: (tr)=>setEditorState(editorState.apply(tr))
            }, /*#__PURE__*/ _react1.default.createElement(_proseMirrorDocJs.ProseMirrorDoc, {
                "data-testid": "editor"
            }));
        }
        (0, _react.render)(/*#__PURE__*/ _react1.default.createElement(TestEditor, null));
        const editor = _react.screen.getByTestId("editor");
        editor.focus();
        await browser.keys("H");
        await browser.keys("e");
        await browser.keys("l");
        await browser.keys("l");
        await browser.keys("o");
        await browser.keys(",");
        await browser.keys(" ");
        await browser.keys("w");
        await browser.keys("o");
        await browser.keys("r");
        await browser.keys("l");
        await browser.keys("d");
        await browser.keys("!");
        expect(outerEditorState.doc.textContent).toBe("Hello, world!");
    });
    it("supports React NodeViews", async ()=>{
        const schema = new _prosemirrorModel.Schema({
            nodes: {
                text: {},
                paragraph: {
                    content: "text*",
                    toDOM () {
                        return [
                            "p",
                            0
                        ];
                    }
                },
                doc: {
                    content: "paragraph+"
                }
            }
        });
        const editorState = _prosemirrorState.EditorState.create({
            schema
        });
        const Paragraph = /*#__PURE__*/ (0, _react1.forwardRef)(function Paragraph(param, ref) {
            let { children  } = param;
            return /*#__PURE__*/ _react1.default.createElement("p", {
                ref: ref,
                "data-testid": "paragraph"
            }, children);
        });
        const reactNodeViews = {
            paragraph: Paragraph
        };
        function TestEditor() {
            return /*#__PURE__*/ _react1.default.createElement(_proseMirrorJs.ProseMirror, {
                defaultState: editorState,
                nodeViews: reactNodeViews
            }, /*#__PURE__*/ _react1.default.createElement(_proseMirrorDocJs.ProseMirrorDoc, {
                "data-testid": "editor"
            }));
        }
        (0, _react.render)(/*#__PURE__*/ _react1.default.createElement(TestEditor, null));
        const editor = _react.screen.getByTestId("editor");
        editor.focus();
        await browser.keys("H");
        await browser.keys("e");
        await browser.keys("l");
        await browser.keys("l");
        await browser.keys("o");
        await browser.keys(",");
        await browser.keys(" ");
        await browser.keys("w");
        await browser.keys("o");
        await browser.keys("r");
        await browser.keys("l");
        await browser.keys("d");
        await browser.keys("!");
        expect(editor.textContent).toBe("Hello, world!");
        // Ensure that ProseMirror really rendered our Paragraph
        // component, not just any old <p> tag
        expect(_react.screen.getAllByTestId("paragraph").length).toBeGreaterThanOrEqual(1);
    });
    it("reflects the current state in .props", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)())
        });
        expect(view.state).toBe(view.props.state);
    });
    it("calls handleScrollToSelection when appropriate", async ()=>{
        let scrolled = 0;
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)()),
            handleScrollToSelection: ()=>{
                scrolled++;
                return false;
            }
        });
        view.dispatch(view.state.tr.scrollIntoView());
        expect(scrolled).toBe(1);
    });
    it("can be queried for the DOM position at a doc position", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.ul)((0, _prosemirrorTestBuilder.li)((0, _prosemirrorTestBuilder.p)((0, _prosemirrorTestBuilder.strong)("foo")))))
        });
        const inText = view.domAtPos(4);
        expect(inText.offset).toBe(1);
        expect(inText.node.nodeValue).toBe("foo");
        const beforeLI = view.domAtPos(1);
        expect(beforeLI.offset).toBe(0);
        expect(beforeLI.node.nodeName).toBe("UL");
        const afterP = view.domAtPos(7);
        expect(afterP.offset).toBe(1);
        expect(afterP.node.nodeName).toBe("LI");
    });
    it("can bias DOM position queries to enter nodes", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)((0, _prosemirrorTestBuilder.em)((0, _prosemirrorTestBuilder.strong)("a"), "b"), "c"))
        });
        function get(pos, bias) {
            const r = view.domAtPos(pos, bias);
            return (r.node.nodeType == 1 ? r.node.nodeName : r.node.nodeValue) + "@" + r.offset;
        }
        expect(get(1, 0)).toBe("P@0");
        expect(get(1, -1)).toBe("P@0");
        expect(get(1, 1)).toBe("a@0");
        expect(get(2, -1)).toBe("a@1");
        expect(get(2, 0)).toBe("EM@1");
        expect(get(2, 1)).toBe("b@0");
        expect(get(3, -1)).toBe("b@1");
        expect(get(3, 0)).toBe("P@1");
        expect(get(3, 1)).toBe("c@0");
        expect(get(4, -1)).toBe("c@1");
        expect(get(4, 0)).toBe("P@2");
        expect(get(4, 1)).toBe("P@2");
    });
    it("can be queried for a node's DOM representation", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo"), (0, _prosemirrorTestBuilder.hr)())
        });
        expect(view.nodeDOM(0).nodeName).toBe("P");
        expect(view.nodeDOM(5).nodeName).toBe("HR");
        expect(view.nodeDOM(3)).toBeNull();
    });
    it("can map DOM positions to doc positions", async ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo"), (0, _prosemirrorTestBuilder.hr)())
        });
        expect(view.posAtDOM(view.dom.firstChild.firstChild, 2)).toBe(3);
        expect(view.posAtDOM(view.dom, 1)).toBe(5);
        expect(view.posAtDOM(view.dom, 2)).toBe(6);
        expect(view.posAtDOM(view.dom.lastChild, 0, -1)).toBe(5);
        expect(view.posAtDOM(view.dom.lastChild, 0, 1)).toBe(6);
    });
    it("binds this to itself in dispatchTransaction prop", async ()=>{
        let thisBinding;
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo"), (0, _prosemirrorTestBuilder.hr)()),
            dispatchTransaction () {
                // eslint-disable-next-line @typescript-eslint/no-this-alias
                thisBinding = this;
            }
        });
        view.dispatch(view.state.tr.insertText("x"));
        expect(view).toBe(thisBinding);
    });
    it("replaces the EditorView when ProseMirror would redraw", async ()=>{
        const viewPlugin = ()=>new _prosemirrorState.Plugin({
                props: {
                    nodeViews: {
                        horizontal_rule () {
                            const dom = document.createElement("hr");
                            return {
                                dom
                            };
                        }
                    }
                }
            });
        const startDoc = (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)());
        const firstState = _prosemirrorState.EditorState.create({
            doc: startDoc,
            schema: _prosemirrorTestBuilder.schema,
            plugins: [
                viewPlugin(),
                (0, _reactKeysJs.reactKeys)()
            ]
        });
        let firstView = null;
        let secondView = null;
        function Test() {
            (0, _useEditorEffectJs.useEditorEffect)((v)=>{
                if (firstView === null) {
                    firstView = v;
                } else {
                    secondView = v;
                }
            });
            return null;
        }
        const Paragraph = /*#__PURE__*/ (0, _react1.forwardRef)(function Paragraph(param, ref) {
            let { nodeProps , children , ...props } = param;
            return /*#__PURE__*/ _react1.default.createElement("p", _extends({
                ref: ref,
                "data-testid": "node-view"
            }, props), children);
        });
        const { rerender  } = (0, _react.render)(/*#__PURE__*/ _react1.default.createElement(_proseMirrorJs.ProseMirror, {
            state: firstState,
            nodeViews: {
                paragraph: Paragraph
            }
        }, /*#__PURE__*/ _react1.default.createElement(Test, null), /*#__PURE__*/ _react1.default.createElement(_proseMirrorDocJs.ProseMirrorDoc, null)));
        expect(()=>_react.screen.getByTestId("node-view")).not.toThrow();
        const secondState = _prosemirrorState.EditorState.create({
            doc: startDoc,
            schema: _prosemirrorTestBuilder.schema,
            plugins: [
                viewPlugin(),
                (0, _reactKeysJs.reactKeys)()
            ]
        });
        rerender(/*#__PURE__*/ _react1.default.createElement(_proseMirrorJs.ProseMirror, {
            state: secondState,
            nodeViews: {
                paragraph: Paragraph
            }
        }, /*#__PURE__*/ _react1.default.createElement(Test, null), /*#__PURE__*/ _react1.default.createElement(_proseMirrorDocJs.ProseMirrorDoc, null)));
        expect(()=>_react.screen.getByTestId("node-view")).not.toThrow();
        expect(firstView).not.toBeNull();
        expect(secondView).not.toBeNull();
        expect(firstView === secondView).toBeFalsy();
    });
    it("supports focusing interactive controls", async ()=>{
        (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.hr)()),
            nodeViews: {
                horizontal_rule: /*#__PURE__*/ (0, _react1.forwardRef)(function Button(param, ref) {
                    let { nodeProps , ...props } = param;
                    (0, _useStopEventJs.useStopEvent)(()=>{
                        return true;
                    });
                    return /*#__PURE__*/ _react1.default.createElement("button", _extends({
                        id: "button",
                        ref: ref,
                        type: "button"
                    }, props), "Click me");
                })
            }
        });
        const button = _react.screen.getByText("Click me");
        await $("#button").click();
        expect(document.activeElement === button).toBeTruthy();
    });
});
