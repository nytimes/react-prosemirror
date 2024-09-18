"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useEditorEventListener", {
    enumerable: true,
    get: ()=>useEditorEventListener
});
const _react = require("react");
const _editorContextJs = require("../contexts/EditorContext.js");
const _useEditorEffectJs = require("./useEditorEffect.js");
function useEditorEventListener(eventType, handler) {
    const { registerEventListener , unregisterEventListener  } = (0, _react.useContext)(_editorContextJs.EditorContext);
    const ref = (0, _react.useRef)(handler);
    (0, _useEditorEffectJs.useEditorEffect)(()=>{
        ref.current = handler;
    }, [
        handler
    ]);
    const eventHandler = (0, _react.useCallback)(function(view, event) {
        return ref.current.call(this, view, event);
    }, []);
    (0, _useEditorEffectJs.useEditorEffect)(()=>{
        registerEventListener(eventType, eventHandler);
        return ()=>unregisterEventListener(eventType, eventHandler);
    }, [
        eventHandler,
        eventType,
        registerEventListener,
        unregisterEventListener
    ]);
}
