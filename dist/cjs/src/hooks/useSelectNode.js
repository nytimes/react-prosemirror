"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useSelectNode", {
    enumerable: true,
    get: function() {
        return useSelectNode;
    }
});
const _react = require("react");
const _SelectNodeContext = require("../contexts/SelectNodeContext.js");
const _useEditorEffect = require("./useEditorEffect.js");
const _useEditorEventCallback = require("./useEditorEventCallback.js");
function useSelectNode(selectNode, deselectNode) {
    const register = (0, _react.useContext)(_SelectNodeContext.SelectNodeContext);
    const selectNodeMemo = (0, _useEditorEventCallback.useEditorEventCallback)(selectNode);
    const deselectNodeMemo = (0, _useEditorEventCallback.useEditorEventCallback)(deselectNode ?? (()=>{
    // empty
    }));
    return (0, _useEditorEffect.useEditorEffect)(()=>{
        register(selectNodeMemo, deselectNodeMemo);
    }, [
        deselectNodeMemo,
        register,
        selectNodeMemo
    ]);
}
