/* eslint-disable @typescript-eslint/no-explicit-any */ function _extends() {
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
import { render } from "@testing-library/react";
import { expect } from "expect";
import { Node } from "prosemirror-model";
import { EditorState, TextSelection } from "prosemirror-state";
import { doc, eq, p, schema } from "prosemirror-test-builder";
import React from "react";
import { ProseMirror } from "../components/ProseMirror.js";
import { ProseMirrorDoc } from "../components/ProseMirrorDoc.js";
import { useEditorEffect } from "../hooks/useEditorEffect.js";
import { reactKeys } from "../plugins/reactKeys.js";
const toEqualNode = function(actual, expected) {
    if (!(actual instanceof Node && expected instanceof Node)) {
        throw new Error("Must be comparing nodes");
    }
    const pass = eq(actual, expected);
    return {
        message: ()=>// `this` context will have correct typings
            `expected ${this.utils.printReceived(actual)} ${pass ? "not " : ""}to equal ${this.utils.printExpected(expected)}`,
        pass
    };
};
expect.extend({
    toEqualNode
});
export function tempEditor(param) {
    let { doc: startDoc , selection , controlled , plugins , ...props } = param;
    startDoc = startDoc ?? doc(p());
    const state = EditorState.create({
        doc: startDoc,
        schema,
        selection: selection ?? startDoc.tag?.a ? TextSelection.create(startDoc, startDoc.tag.a, startDoc.tag?.b) : undefined,
        plugins: [
            ...plugins ?? [],
            reactKeys()
        ]
    });
    let view = null;
    function Test() {
        useEditorEffect((v)=>{
            view = v;
        });
        return null;
    }
    const { rerender , unmount  } = render(/*#__PURE__*/ React.createElement(ProseMirror, _extends({}, controlled ? {
        state
    } : {
        defaultState: state
    }, props), /*#__PURE__*/ React.createElement(Test, null), /*#__PURE__*/ React.createElement(ProseMirrorDoc, null)));
    function rerenderEditor(param) {
        let { ...newProps } = param;
        rerender(/*#__PURE__*/ React.createElement(ProseMirror, _extends({}, controlled ? {
            state
        } : {
            defaultState: state
        }, {
            ...props,
            ...newProps
        }), /*#__PURE__*/ React.createElement(Test, null), /*#__PURE__*/ React.createElement(ProseMirrorDoc, null)));
        return view;
    }
    return {
        view: view,
        rerender: rerenderEditor,
        unmount
    };
}
