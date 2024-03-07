"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useEditorState", {
    enumerable: true,
    get: ()=>useEditorState
});
const _react = require("react");
const _editorContextJs = require("../contexts/EditorContext.js");
function useEditorState() {
    const { state: editorState  } = (0, _react.useContext)(_editorContextJs.EditorContext);
    return editorState;
}
