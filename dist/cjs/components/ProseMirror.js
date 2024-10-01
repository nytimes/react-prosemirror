"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ProseMirror", {
    enumerable: true,
    get: ()=>ProseMirror
});
const _prosemirrorView = require("prosemirror-view");
const _react = /*#__PURE__*/ _interopRequireWildcard(require("react"));
const _editorContextJs = require("../contexts/EditorContext.js");
const _editorStateContextJs = require("../contexts/EditorStateContext.js");
const _nodeViewContextJs = require("../contexts/NodeViewContext.js");
const _computeDocDecoJs = require("../decorations/computeDocDeco.js");
const _viewDecorationsJs = require("../decorations/viewDecorations.js");
const _useEditorJs = require("../hooks/useEditor.js");
const _layoutGroupJs = require("./LayoutGroup.js");
const _proseMirrorDocJs = require("./ProseMirrorDoc.js");
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
const EMPTY_OUTER_DECOS = [];
function ProseMirrorInner(param) {
    let { className , children , nodeViews ={} , customNodeViews , ...props } = param;
    const [mount, setMount] = (0, _react.useState)(null);
    const { editor , state  } = (0, _useEditorJs.useEditor)(mount, {
        ...props,
        nodeViews: customNodeViews
    });
    const innerDecos = editor.view ? (0, _viewDecorationsJs.viewDecorations)(editor.view, editor.cursorWrapper) : _prosemirrorView.DecorationSet.empty;
    const outerDecos = editor.view ? (0, _computeDocDecoJs.computeDocDeco)(editor.view) : EMPTY_OUTER_DECOS;
    const nodeViewContextValue = (0, _react.useMemo)(()=>({
            nodeViews
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
    return /*#__PURE__*/ _react.default.createElement(_editorContextJs.EditorContext.Provider, {
        value: editor
    }, /*#__PURE__*/ _react.default.createElement(_editorStateContextJs.EditorStateContext.Provider, {
        value: state
    }, /*#__PURE__*/ _react.default.createElement(_nodeViewContextJs.NodeViewContext.Provider, {
        value: nodeViewContextValue
    }, /*#__PURE__*/ _react.default.createElement(_proseMirrorDocJs.DocNodeViewContext.Provider, {
        value: docNodeViewContextValue
    }, children))));
}
function ProseMirror(props) {
    return /*#__PURE__*/ _react.default.createElement(_layoutGroupJs.LayoutGroup, null, /*#__PURE__*/ _react.default.createElement(ProseMirrorInner, _extends({}, props)));
}
