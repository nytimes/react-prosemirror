"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useSelectNode", {
    enumerable: true,
    get: ()=>useSelectNode
});
const _react = require("react");
const _selectNodeContextJs = require("../contexts/SelectNodeContext.js");
const _useEditorEffectJs = require("./useEditorEffect.js");
const _useEditorEventCallbackJs = require("./useEditorEventCallback.js");
function useSelectNode(selectNode, deselectNode) {
    const register = (0, _react.useContext)(_selectNodeContextJs.SelectNodeContext);
    const selectNodeMemo = (0, _useEditorEventCallbackJs.useEditorEventCallback)(selectNode);
    const deselectNodeMemo = (0, _useEditorEventCallbackJs.useEditorEventCallback)(deselectNode ?? (()=>{
    // empty
    }));
    return (0, _useEditorEffectJs.useEditorEffect)(()=>{
        register(selectNodeMemo, deselectNodeMemo);
    }, [
        deselectNodeMemo,
        register,
        selectNodeMemo
    ]);
}
