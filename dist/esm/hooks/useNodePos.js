import React, { createContext, useContext } from "react";
import { reactPluginKey } from "../plugins/react.js";
import { useEditorState } from "./useEditorState.js";
const NodePosContext = /*#__PURE__*/ createContext(null);
export function NodePosProvider(param) {
    let { nodeKey , children  } = param;
    const editorState = useEditorState();
    if (!editorState) return /*#__PURE__*/ React.createElement(React.Fragment, null, children);
    const pluginState = reactPluginKey.getState(editorState);
    if (!pluginState) return /*#__PURE__*/ React.createElement(React.Fragment, null, children);
    return /*#__PURE__*/ React.createElement(NodePosContext.Provider, {
        value: pluginState.keyToPos.get(nodeKey) ?? 0
    }, children);
}
export function useNodePos() {
    return useContext(NodePosContext);
}
