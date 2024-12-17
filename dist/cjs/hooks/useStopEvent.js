"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useStopEvent", {
    enumerable: true,
    get: function() {
        return useStopEvent;
    }
});
const _react = require("react");
const _StopEventContext = require("../contexts/StopEventContext.js");
const _useEditorEffect = require("./useEditorEffect.js");
const _useEditorEventCallback = require("./useEditorEventCallback.js");
function useStopEvent(stopEvent) {
    const register = (0, _react.useContext)(_StopEventContext.StopEventContext);
    const stopEventMemo = (0, _useEditorEventCallback.useEditorEventCallback)(stopEvent);
    (0, _useEditorEffect.useEditorEffect)(()=>{
        register(stopEventMemo);
    }, [
        register,
        stopEventMemo
    ]);
}
