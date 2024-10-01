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
const _react = require("@testing-library/react");
const _expect = require("expect");
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
_expect.expect.extend({
    toEqualNode
});
function tempEditor(param) {
    let { doc: startDoc , selection , controlled , plugins , ...props } = param;
    startDoc = startDoc ?? (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)());
    const state = _prosemirrorState.EditorState.create({
        doc: startDoc,
        schema: _prosemirrorTestBuilder.schema,
        selection: selection ?? startDoc.tag?.a ? _prosemirrorState.TextSelection.create(startDoc, startDoc.tag.a, startDoc.tag?.b) : undefined,
        plugins: [
            ...plugins ?? [],
            (0, _reactKeysJs.reactKeys)()
        ]
    });
    let view = null;
    function Test() {
        (0, _useEditorEffectJs.useEditorEffect)((v)=>{
            view = v;
        });
        return null;
    }
    const { rerender , unmount  } = (0, _react.render)(/*#__PURE__*/ _react1.default.createElement(_proseMirrorJs.ProseMirror, _extends({}, controlled ? {
        state
    } : {
        defaultState: state
    }, props), /*#__PURE__*/ _react1.default.createElement(Test, null), /*#__PURE__*/ _react1.default.createElement(_proseMirrorDocJs.ProseMirrorDoc, null)));
    function rerenderEditor() {
        let { ...newProps } = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        rerender(/*#__PURE__*/ _react1.default.createElement(_proseMirrorJs.ProseMirror, _extends({}, controlled ? {
            state
        } : {
            defaultState: state
        }, {
            ...props,
            ...newProps
        }), /*#__PURE__*/ _react1.default.createElement(Test, null), /*#__PURE__*/ _react1.default.createElement(_proseMirrorDocJs.ProseMirrorDoc, null)));
        return view;
    }
    // We need two renders for the hasContentDOM state to settle
    rerenderEditor();
    return {
        view: view,
        rerender: rerenderEditor,
        unmount
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
