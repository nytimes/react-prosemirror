"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useEditorEventListener", {
    enumerable: true,
    get: function() {
        return useEditorEventListener;
    }
});
const _react = require("react");
const _EditorContext = require("../contexts/EditorContext.js");
const _useEditorEffect = require("./useEditorEffect.js");
function useEditorEventListener(eventType, handler) {
    const { registerEventListener, unregisterEventListener } = (0, _react.useContext)(_EditorContext.EditorContext);
    const ref = (0, _react.useRef)(handler);
    (0, _useEditorEffect.useEditorEffect)(()=>{
        ref.current = handler;
    }, [
        handler
    ]);
    const eventHandler = (0, _react.useCallback)(function(view, event) {
        return ref.current.call(this, view, event);
    }, []);
    (0, _useEditorEffect.useEditorEffect)(()=>{
        registerEventListener(eventType, eventHandler);
        return ()=>unregisterEventListener(eventType, eventHandler);
    }, [
        eventHandler,
        eventType,
        registerEventListener,
        unregisterEventListener
    ]);
}
