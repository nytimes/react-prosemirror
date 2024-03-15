/* eslint-disable @typescript-eslint/no-explicit-any */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    tempEditor: ()=>tempEditor,
    findTextNode: ()=>findTextNode
});
const _globals = require("@jest/globals");
const _react = require("@testing-library/react");
const _prosemirrorModel = require("prosemirror-model");
const _prosemirrorState = require("prosemirror-state");
const _prosemirrorTestBuilder = require("prosemirror-test-builder");
const _react1 = /*#__PURE__*/ _interopRequireDefault(require("react"));
const _proseMirrorJs = require("../components/ProseMirror.js");
const _proseMirrorDocJs = require("../components/ProseMirrorDoc.js");
const _useEditorEffectJs = require("../hooks/useEditorEffect.js");
const _reactKeysJs = require("../plugins/reactKeys.js");
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
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const toEqualNode = function(actual, expected) {
    if (!(actual instanceof _prosemirrorModel.Node && expected instanceof _prosemirrorModel.Node)) {
        throw new Error("Must be comparing nodes");
    }
    const pass = (0, _prosemirrorTestBuilder.eq)(actual, expected);
    return {
        message: ()=>// `this` context will have correct typings
            `expected ${this.utils.printReceived(actual)} ${pass ? "not " : ""}to equal ${this.utils.printExpected(expected)}`,
        pass
    };
};
_globals.expect.extend({
    toEqualNode
});
function tempEditor(param) {
    let { doc: startDoc , selection , plugins , state: stateProp , ...props } = param;
    startDoc = startDoc ?? (0, _prosemirrorTestBuilder.doc)();
    const state = stateProp ?? _prosemirrorState.EditorState.create({
        doc: startDoc,
        schema: _prosemirrorTestBuilder.schema,
        selection: selection ?? startDoc.tag?.a ? _prosemirrorState.TextSelection.create(startDoc, startDoc.tag.a, startDoc.tag?.b) : undefined,
        plugins: [
            ...plugins ?? [],
            (0, _reactKeysJs.reactKeys)()
        ]
    });
    let view;
    function Test() {
        (0, _useEditorEffectJs.useEditorEffect)((v)=>{
            view = v;
        });
        return null;
    }
    const { rerender , unmount  } = (0, _react.render)(/*#__PURE__*/ _react1.default.createElement(_proseMirrorJs.ProseMirror, _extends({}, stateProp ? {
        state: stateProp
    } : {
        defaultState: state
    }, props), /*#__PURE__*/ _react1.default.createElement(Test, null), /*#__PURE__*/ _react1.default.createElement(_proseMirrorDocJs.ProseMirrorDoc, null)));
    function rerenderEditor(param) {
        let { state: newStateProp , ...newProps } = param;
        rerender(/*#__PURE__*/ _react1.default.createElement(_proseMirrorJs.ProseMirror, _extends({}, newStateProp && stateProp ? {
            state: newStateProp
        } : {
            defaultState: state
        }, {
            ...props,
            ...newProps
        }), /*#__PURE__*/ _react1.default.createElement(Test, null), /*#__PURE__*/ _react1.default.createElement(_proseMirrorDocJs.ProseMirrorDoc, null)));
    }
    return {
        rerender: rerenderEditor,
        unmount,
        view
    };
}
function findTextNodeInner(node, text) {
    if (node.nodeType == 3) {
        if (node.nodeValue == text) return node;
    } else if (node.nodeType == 1) {
        for(let ch = node.firstChild; ch; ch = ch.nextSibling){
            const found = findTextNodeInner(ch, text);
            if (found) return found;
        }
    }
    return undefined;
}
function findTextNode(node, text) {
    const found = findTextNodeInner(node, text);
    if (found) return found;
    throw new Error("Unable to find matching text node");
}
