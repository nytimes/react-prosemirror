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
    findTextNode: function() {
        return findTextNode;
    },
    tempEditor: function() {
        return tempEditor;
    }
});
const _react = require("@testing-library/react");
const _expect = require("expect");
const _prosemirrormodel = require("prosemirror-model");
const _prosemirrorstate = require("prosemirror-state");
const _prosemirrortestbuilder = require("prosemirror-test-builder");
const _react1 = /*#__PURE__*/ _interop_require_default(require("react"));
const _ProseMirror = require("../components/ProseMirror.js");
const _ProseMirrorDoc = require("../components/ProseMirrorDoc.js");
const _useEditorEffect = require("../hooks/useEditorEffect.js");
const _reactKeys = require("../plugins/reactKeys.js");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const toEqualNode = function(actual, expected) {
    if (!(actual instanceof _prosemirrormodel.Node && expected instanceof _prosemirrormodel.Node)) {
        throw new Error("Must be comparing nodes");
    }
    const pass = (0, _prosemirrortestbuilder.eq)(actual, expected);
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
    let { doc: startDoc, selection, controlled, plugins, ...props } = param;
    startDoc = startDoc ?? (0, _prosemirrortestbuilder.doc)((0, _prosemirrortestbuilder.p)());
    const state = _prosemirrorstate.EditorState.create({
        doc: startDoc,
        schema: _prosemirrortestbuilder.schema,
        selection: selection ?? startDoc.tag?.a ? _prosemirrorstate.TextSelection.create(startDoc, startDoc.tag.a, startDoc.tag?.b) : undefined,
        plugins: [
            ...plugins ?? [],
            (0, _reactKeys.reactKeys)()
        ]
    });
    let view = null;
    function Test() {
        (0, _useEditorEffect.useEditorEffect)((v)=>{
            view = v;
        });
        return null;
    }
    const { rerender, unmount } = (0, _react.render)(/*#__PURE__*/ _react1.default.createElement(_ProseMirror.ProseMirror, {
        ...controlled ? {
            state
        } : {
            defaultState: state
        },
        ...props
    }, /*#__PURE__*/ _react1.default.createElement(Test, null), /*#__PURE__*/ _react1.default.createElement(_ProseMirrorDoc.ProseMirrorDoc, null)));
    function rerenderEditor() {
        let { ...newProps } = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        rerender(/*#__PURE__*/ _react1.default.createElement(_ProseMirror.ProseMirror, {
            ...controlled ? {
                state
            } : {
                defaultState: state
            },
            ...props,
            ...newProps
        }, /*#__PURE__*/ _react1.default.createElement(Test, null), /*#__PURE__*/ _react1.default.createElement(_ProseMirrorDoc.ProseMirrorDoc, null)));
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
