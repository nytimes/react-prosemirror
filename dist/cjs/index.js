"use client";
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
    ProseMirror: function() {
        return _ProseMirror.ProseMirror;
    },
    ProseMirrorDoc: function() {
        return _ProseMirrorDoc.ProseMirrorDoc;
    },
    reactKeys: function() {
        return _reactKeys.reactKeys;
    },
    useEditorEffect: function() {
        return _useEditorEffect.useEditorEffect;
    },
    useEditorEventCallback: function() {
        return _useEditorEventCallback.useEditorEventCallback;
    },
    useEditorEventListener: function() {
        return _useEditorEventListener.useEditorEventListener;
    },
    useEditorState: function() {
        return _useEditorState.useEditorState;
    },
    useSelectNode: function() {
        return _useSelectNode.useSelectNode;
    },
    useStopEvent: function() {
        return _useStopEvent.useStopEvent;
    },
    widget: function() {
        return _ReactWidgetType.widget;
    }
});
const _ProseMirror = require("./components/ProseMirror.js");
const _ProseMirrorDoc = require("./components/ProseMirrorDoc.js");
const _useEditorEffect = require("./hooks/useEditorEffect.js");
const _useEditorEventCallback = require("./hooks/useEditorEventCallback.js");
const _useEditorEventListener = require("./hooks/useEditorEventListener.js");
const _useEditorState = require("./hooks/useEditorState.js");
const _useStopEvent = require("./hooks/useStopEvent.js");
const _useSelectNode = require("./hooks/useSelectNode.js");
const _reactKeys = require("./plugins/reactKeys.js");
const _ReactWidgetType = require("./decorations/ReactWidgetType.js");
