/* eslint-disable @typescript-eslint/no-empty-function */ import { render } from "@testing-library/react";
import React from "react";
import { LayoutGroup } from "../../components/LayoutGroup.js";
import { EditorContext } from "../../contexts/EditorContext.js";
import { EditorStateContext } from "../../contexts/EditorStateContext.js";
import { useEditorEffect } from "../useEditorEffect.js";
function TestComponent(param) {
    let { effect , dependencies =[]  } = param;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEditorEffect(effect, dependencies);
    return null;
}
describe("useEditorViewLayoutEffect", ()=>{
    it("should run the effect", ()=>{
        const effect = jest.fn();
        const editorView = {};
        const editorState = {};
        const registerEventListener = ()=>{};
        const unregisterEventListener = ()=>{};
        render(/*#__PURE__*/ React.createElement(LayoutGroup, null, /*#__PURE__*/ React.createElement(EditorContext.Provider, {
            value: {
                view: editorView,
                registerEventListener,
                unregisterEventListener
            }
        }, /*#__PURE__*/ React.createElement(EditorStateContext.Provider, {
            value: editorState
        }, /*#__PURE__*/ React.createElement(TestComponent, {
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
        const { rerender  } = render(/*#__PURE__*/ React.createElement(LayoutGroup, null, /*#__PURE__*/ React.createElement(EditorContext.Provider, {
            value: contextValue
        }, /*#__PURE__*/ React.createElement(EditorStateContext.Provider, {
            value: editorState
        }, /*#__PURE__*/ React.createElement(TestComponent, {
            effect: effect,
            dependencies: []
        })), " ")));
        rerender(/*#__PURE__*/ React.createElement(LayoutGroup, null, /*#__PURE__*/ React.createElement(EditorContext.Provider, {
            value: contextValue
        }, /*#__PURE__*/ React.createElement(EditorStateContext.Provider, {
            value: editorState
        }, /*#__PURE__*/ React.createElement(TestComponent, {
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
        const { rerender  } = render(/*#__PURE__*/ React.createElement(LayoutGroup, null, /*#__PURE__*/ React.createElement(EditorContext.Provider, {
            value: {
                view: editorView,
                registerEventListener,
                unregisterEventListener
            }
        }, /*#__PURE__*/ React.createElement(EditorStateContext.Provider, {
            value: editorState
        }, /*#__PURE__*/ React.createElement(TestComponent, {
            effect: effect,
            dependencies: [
                "one"
            ]
        })))));
        rerender(/*#__PURE__*/ React.createElement(LayoutGroup, null, /*#__PURE__*/ React.createElement(EditorContext.Provider, {
            value: {
                view: editorView,
                registerEventListener,
                unregisterEventListener
            }
        }, /*#__PURE__*/ React.createElement(EditorStateContext.Provider, {
            value: editorState
        }, /*#__PURE__*/ React.createElement(TestComponent, {
            effect: effect,
            dependencies: [
                "two"
            ]
        })))));
        expect(effect).toHaveBeenCalledTimes(2);
    });
});
