"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useEditorState", {
    enumerable: true,
    get: function() {
        return useEditorState;
    }
});
const _react = require("react");
const _EditorStateContext = require("../contexts/EditorStateContext.js");
function useEditorState() {
    const editorState = (0, _react.useContext)(_EditorStateContext.EditorStateContext);
    return editorState;
}
