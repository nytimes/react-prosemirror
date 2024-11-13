"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useEditorState", {
    enumerable: true,
    get: ()=>useEditorState
});
const _react = require("react");
const _editorStateContextJs = require("../contexts/EditorStateContext.js");
function useEditorState() {
    const editorState = (0, _react.useContext)(_editorStateContextJs.EditorStateContext);
    return editorState;
}
