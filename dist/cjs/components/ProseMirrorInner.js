"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ProseMirrorInner", {
    enumerable: true,
    get: ()=>ProseMirrorInner
});
const _react = /*#__PURE__*/ _interopRequireWildcard(require("react"));
const _editorContextJs = require("../contexts/EditorContext.js");
const _useComponentEventListenersJs = require("../hooks/useComponentEventListeners.js");
const _useEditorViewJs = require("../hooks/useEditorView.js");
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
function ProseMirrorInner(param) {
    let { children , mount , ...editorProps } = param;
    const { componentEventListenersPlugin , registerEventListener , unregisterEventListener  } = (0, _useComponentEventListenersJs.useComponentEventListeners)();
    const plugins = (0, _react.useMemo)(()=>[
            ...editorProps.plugins ?? [],
            componentEventListenersPlugin
        ], [
        editorProps.plugins,
        componentEventListenersPlugin
    ]);
    const editorView = (0, _useEditorViewJs.useEditorView)(mount, {
        ...editorProps,
        plugins
    });
    const editorState = "state" in editorProps ? editorProps.state : editorView?.state ?? null;
    const editorContextValue = (0, _react.useMemo)(()=>({
            editorView,
            editorState,
            registerEventListener,
            unregisterEventListener
        }), [
        editorState,
        editorView,
        registerEventListener,
        unregisterEventListener
    ]);
    return /*#__PURE__*/ _react.default.createElement(_editorContextJs.EditorProvider, {
        value: editorContextValue
    }, children ?? null);
}
