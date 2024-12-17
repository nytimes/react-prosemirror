"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ProseMirror", {
    enumerable: true,
    get: function() {
        return ProseMirror;
    }
});
const _prosemirrorview = require("prosemirror-view");
const _react = /*#__PURE__*/ _interop_require_wildcard(require("react"));
const _EditorContext = require("../contexts/EditorContext.js");
const _EditorStateContext = require("../contexts/EditorStateContext.js");
const _NodeViewContext = require("../contexts/NodeViewContext.js");
const _computeDocDeco = require("../decorations/computeDocDeco.js");
const _viewDecorations = require("../decorations/viewDecorations.js");
const _useEditor = require("../hooks/useEditor.js");
const _LayoutGroup = require("./LayoutGroup.js");
const _ProseMirrorDoc = require("./ProseMirrorDoc.js");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
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
    var newObj = {
        __proto__: null
    };
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
const EMPTY_OUTER_DECOS = [];
function ProseMirrorInner(param) {
    let { className, children, nodeViews, customNodeViews, ...props } = param;
    const [mount, setMount] = (0, _react.useState)(null);
    const { editor, state } = (0, _useEditor.useEditor)(mount, {
        ...props,
        nodeViews: customNodeViews
    });
    const innerDecos = editor.view ? (0, _viewDecorations.viewDecorations)(editor.view, editor.cursorWrapper) : _prosemirrorview.DecorationSet.empty;
    const outerDecos = editor.view ? (0, _computeDocDeco.computeDocDeco)(editor.view) : EMPTY_OUTER_DECOS;
    const nodeViewContextValue = (0, _react.useMemo)(()=>({
            nodeViews: nodeViews ?? {}
        }), [
        nodeViews
    ]);
    const docNodeViewContextValue = (0, _react.useMemo)(()=>({
            className: className,
            setMount: setMount,
            node: editor.view?.state.doc,
            innerDeco: innerDecos,
            outerDeco: outerDecos,
            viewDesc: editor.docViewDescRef.current
        }), [
        className,
        editor.docViewDescRef,
        editor.view?.state.doc,
        innerDecos,
        outerDecos
    ]);
    return /*#__PURE__*/ _react.default.createElement(_EditorContext.EditorContext.Provider, {
        value: editor
    }, /*#__PURE__*/ _react.default.createElement(_EditorStateContext.EditorStateContext.Provider, {
        value: state
    }, /*#__PURE__*/ _react.default.createElement(_NodeViewContext.NodeViewContext.Provider, {
        value: nodeViewContextValue
    }, /*#__PURE__*/ _react.default.createElement(_ProseMirrorDoc.DocNodeViewContext.Provider, {
        value: docNodeViewContextValue
    }, children))));
}
function ProseMirror(props) {
    return /*#__PURE__*/ _react.default.createElement(_LayoutGroup.LayoutGroup, null, /*#__PURE__*/ _react.default.createElement(ProseMirrorInner, props));
}
