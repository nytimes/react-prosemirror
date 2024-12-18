/* eslint-disable @typescript-eslint/no-empty-function */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _react = require("@testing-library/react");
const _react1 = /*#__PURE__*/ _interopRequireDefault(require("react"));
const _layoutGroupJs = require("../../components/LayoutGroup.js");
const _editorContextJs = require("../../contexts/EditorContext.js");
const _editorStateContextJs = require("../../contexts/EditorStateContext.js");
const _useEditorEffectJs = require("../useEditorEffect.js");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function TestComponent(param) {
    let { effect , dependencies =[]  } = param;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    (0, _useEditorEffectJs.useEditorEffect)(effect, dependencies);
    return null;
}
describe("useEditorViewLayoutEffect", ()=>{
    it("should run the effect", ()=>{
        const effect = jest.fn();
        const editorView = {};
        const editorState = {};
        const registerEventListener = ()=>{};
        const unregisterEventListener = ()=>{};
        (0, _react.render)(/*#__PURE__*/ _react1.default.createElement(_layoutGroupJs.LayoutGroup, null, /*#__PURE__*/ _react1.default.createElement(_editorContextJs.EditorContext.Provider, {
            value: {
                view: editorView,
                registerEventListener,
                unregisterEventListener
            }
        }, /*#__PURE__*/ _react1.default.createElement(_editorStateContextJs.EditorStateContext.Provider, {
            value: editorState
        }, /*#__PURE__*/ _react1.default.createElement(TestComponent, {
            effect: effect
        })))));
        expect(effect).toHaveBeenCalled();
        expect(effect).toHaveBeenCalledWith(editorView);
    });
    it("should not re-run the effect if no dependencies change", ()=>{
        const effect = jest.fn();
        const editorView = {};
        const editorState = {};
        const registerEventListener = ()=>{};
        const unregisterEventListener = ()=>{};
        const contextValue = {
            view: editorView,
            registerEventListener,
            unregisterEventListener
        };
        const { rerender  } = (0, _react.render)(/*#__PURE__*/ _react1.default.createElement(_layoutGroupJs.LayoutGroup, null, /*#__PURE__*/ _react1.default.createElement(_editorContextJs.EditorContext.Provider, {
            value: contextValue
        }, /*#__PURE__*/ _react1.default.createElement(_editorStateContextJs.EditorStateContext.Provider, {
            value: editorState
        }, /*#__PURE__*/ _react1.default.createElement(TestComponent, {
            effect: effect,
            dependencies: []
        })), " ")));
        rerender(/*#__PURE__*/ _react1.default.createElement(_layoutGroupJs.LayoutGroup, null, /*#__PURE__*/ _react1.default.createElement(_editorContextJs.EditorContext.Provider, {
            value: contextValue
        }, /*#__PURE__*/ _react1.default.createElement(_editorStateContextJs.EditorStateContext.Provider, {
            value: editorState
        }, /*#__PURE__*/ _react1.default.createElement(TestComponent, {
            effect: effect,
            dependencies: []
        })))));
        expect(effect).toHaveBeenCalledTimes(1);
    });
    it("should re-run the effect if dependencies change", ()=>{
        const effect = jest.fn();
        const editorView = {};
        const editorState = {};
        const registerEventListener = ()=>{};
        const unregisterEventListener = ()=>{};
        const { rerender  } = (0, _react.render)(/*#__PURE__*/ _react1.default.createElement(_layoutGroupJs.LayoutGroup, null, /*#__PURE__*/ _react1.default.createElement(_editorContextJs.EditorContext.Provider, {
            value: {
                view: editorView,
                registerEventListener,
                unregisterEventListener
            }
        }, /*#__PURE__*/ _react1.default.createElement(_editorStateContextJs.EditorStateContext.Provider, {
            value: editorState
        }, /*#__PURE__*/ _react1.default.createElement(TestComponent, {
            effect: effect,
            dependencies: [
                "one"
            ]
        })))));
        rerender(/*#__PURE__*/ _react1.default.createElement(_layoutGroupJs.LayoutGroup, null, /*#__PURE__*/ _react1.default.createElement(_editorContextJs.EditorContext.Provider, {
            value: {
                view: editorView,
                registerEventListener,
                unregisterEventListener
            }
        }, /*#__PURE__*/ _react1.default.createElement(_editorStateContextJs.EditorStateContext.Provider, {
            value: editorState
        }, /*#__PURE__*/ _react1.default.createElement(TestComponent, {
            effect: effect,
            dependencies: [
                "two"
            ]
        })))));
        expect(effect).toHaveBeenCalledTimes(2);
    });
});
