"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useReactKeys", {
    enumerable: true,
    get: ()=>useReactKeys
});
const _reactKeysJs = require("../plugins/reactKeys.js");
const _useEditorStateJs = require("./useEditorState.js");
function useReactKeys() {
    const state = (0, _useEditorStateJs.useEditorState)();
    return state && _reactKeysJs.reactKeysPluginKey.getState(state);
}
