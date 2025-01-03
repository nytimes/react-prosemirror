"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useReactKeys", {
    enumerable: true,
    get: ()=>useReactKeys
});
const _react = require("react");
const _editorContextJs = require("../contexts/EditorContext.js");
const _reactKeysJs = require("../plugins/reactKeys.js");
function useReactKeys() {
    const { view  } = (0, _react.useContext)(_editorContextJs.EditorContext);
    return view && _reactKeysJs.reactKeysPluginKey.getState(view.state);
}
