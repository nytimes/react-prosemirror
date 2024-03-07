"use strict";
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
    NodePosProvider: ()=>NodePosProvider,
    useNodePos: ()=>useNodePos
});
const _react = /*#__PURE__*/ _interopRequireWildcard(require("react"));
const _reactJs = require("../plugins/react.js");
const _useEditorStateJs = require("./useEditorState.js");
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
const NodePosContext = /*#__PURE__*/ (0, _react.createContext)(null);
function NodePosProvider(param) {
    let { nodeKey , children  } = param;
    const editorState = (0, _useEditorStateJs.useEditorState)();
    if (!editorState) return /*#__PURE__*/ _react.default.createElement(_react.default.Fragment, null, children);
    const pluginState = _reactJs.reactPluginKey.getState(editorState);
    if (!pluginState) return /*#__PURE__*/ _react.default.createElement(_react.default.Fragment, null, children);
    return /*#__PURE__*/ _react.default.createElement(NodePosContext.Provider, {
        value: pluginState.keyToPos.get(nodeKey) ?? 0
    }, children);
}
function useNodePos() {
    return (0, _react.useContext)(NodePosContext);
}
