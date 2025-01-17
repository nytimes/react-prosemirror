"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useStopEvent", {
    enumerable: true,
    get: ()=>useStopEvent
});
const _react = require("react");
const _stopEventContextJs = require("../contexts/StopEventContext.js");
const _useEditorEffectJs = require("./useEditorEffect.js");
const _useEditorEventCallbackJs = require("./useEditorEventCallback.js");
function useStopEvent(stopEvent) {
    const register = (0, _react.useContext)(_stopEventContextJs.StopEventContext);
    const stopEventMemo = (0, _useEditorEventCallbackJs.useEditorEventCallback)(stopEvent);
    (0, _useEditorEffectJs.useEditorEffect)(()=>{
        register(stopEventMemo);
    }, [
        register,
        stopEventMemo
    ]);
}
