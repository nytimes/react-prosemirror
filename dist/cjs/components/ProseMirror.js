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
const _nodeViewContextJs = require("../contexts/NodeViewContext.js");
const _computeDocDecoJs = require("../decorations/computeDocDeco.js");
const _viewDecorationsJs = require("../decorations/viewDecorations.js");
const _useEditorJs = require("../hooks/useEditor.js");
const _usePendingViewEffectsJs = require("../hooks/usePendingViewEffects.js");
const _layoutGroupJs = require("./LayoutGroup.js");
const _proseMirrorDocJs = require("./ProseMirrorDoc.js");
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
function ProseMirror(param) {
    let { className , children , nodeViews ={} , customNodeViews , ...props } = param;
    const [mount, setMount] = (0, _react.useState)(null);
    const editor = (0, _useEditorJs.useEditor)(mount, {
        ...props,
        nodeViews: customNodeViews
    });
    (0, _usePendingViewEffectsJs.usePendingViewEffects)(editor.view);
    const innerDecos = editor.view ? (0, _viewDecorationsJs.viewDecorations)(editor.view, editor.cursorWrapper) : _prosemirrorView.DecorationSet.empty;
    const outerDecos = editor.view ? (0, _computeDocDecoJs.computeDocDeco)(editor.view) : [];
    return /*#__PURE__*/ _react.default.createElement(_layoutGroupJs.LayoutGroup, null, /*#__PURE__*/ _react.default.createElement(_editorContextJs.EditorContext.Provider, {
        value: editor
    }, /*#__PURE__*/ _react.default.createElement(_nodeViewContextJs.NodeViewContext.Provider, {
        value: {
            nodeViews
        }
    }, /*#__PURE__*/ _react.default.createElement(_proseMirrorDocJs.DocNodeViewContext.Provider, {
        value: {
            className: className,
            setMount: setMount,
            node: editor.view?.state.doc,
            innerDeco: innerDecos,
            outerDeco: outerDecos,
            viewDesc: editor.docViewDescRef.current
        }
    }, children))));
}
