"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    ProseMirror: ()=>_proseMirrorJs.ProseMirror,
    ProseMirrorDoc: ()=>_proseMirrorDocJs.ProseMirrorDoc,
    useEditorEffect: ()=>_useEditorEffectJs.useEditorEffect,
    useEditorEventCallback: ()=>_useEditorEventCallbackJs.useEditorEventCallback,
    useEditorEventListener: ()=>_useEditorEventListenerJs.useEditorEventListener,
    useEditorState: ()=>_useEditorStateJs.useEditorState,
    useStopEvent: ()=>_useStopEventJs.useStopEvent,
    reactKeys: ()=>_reactKeysJs.reactKeys,
    widget: ()=>_reactWidgetTypeJs.widget
});
const _proseMirrorJs = require("./components/ProseMirror.js");
const _proseMirrorDocJs = require("./components/ProseMirrorDoc.js");
const _useEditorEffectJs = require("./hooks/useEditorEffect.js");
const _useEditorEventCallbackJs = require("./hooks/useEditorEventCallback.js");
const _useEditorEventListenerJs = require("./hooks/useEditorEventListener.js");
const _useEditorStateJs = require("./hooks/useEditorState.js");
const _useStopEventJs = require("./hooks/useStopEvent.js");
const _reactKeysJs = require("./plugins/reactKeys.js");
const _reactWidgetTypeJs = require("./decorations/ReactWidgetType.js");
"use client";
