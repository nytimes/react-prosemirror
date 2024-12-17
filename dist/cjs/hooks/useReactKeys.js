"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useReactKeys", {
    enumerable: true,
    get: function() {
        return useReactKeys;
    }
});
const _react = require("react");
const _EditorContext = require("../contexts/EditorContext.js");
const _reactKeys = require("../plugins/reactKeys.js");
function useReactKeys() {
    const { view } = (0, _react.useContext)(_EditorContext.EditorContext);
    return view && _reactKeys.reactKeysPluginKey.getState(view.state);
}
