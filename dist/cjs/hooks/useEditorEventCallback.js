"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useEditorEventCallback", {
    enumerable: true,
    get: function() {
        return useEditorEventCallback;
    }
});
const _react = require("react");
const _EditorContext = require("../contexts/EditorContext.js");
const _useEditorEffect = require("./useEditorEffect.js");
function useEditorEventCallback(callback) {
    const ref = (0, _react.useRef)(callback);
    const { view } = (0, _react.useContext)(_EditorContext.EditorContext);
    (0, _useEditorEffect.useEditorEffect)(()=>{
        ref.current = callback;
    }, [
        callback
    ]);
    return (0, _react.useCallback)(function() {
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        if (view) {
            return ref.current(view, ...args);
        }
        return;
    }, [
        view
    ]);
}
