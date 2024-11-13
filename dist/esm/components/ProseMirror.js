function _extends() {
    _extends = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends.apply(this, arguments);
}
import { DecorationSet } from "prosemirror-view";
import React, { useState } from "react";
import { EditorContext } from "../contexts/EditorContext.js";
import { NodeViewContext } from "../contexts/NodeViewContext.js";
import { computeDocDeco } from "../decorations/computeDocDeco.js";
import { viewDecorations } from "../decorations/viewDecorations.js";
import { useEditor } from "../hooks/useEditor.js";
import { LayoutGroup } from "./LayoutGroup.js";
import { DocNodeViewContext } from "./ProseMirrorDoc.js";
function ProseMirrorInner(param) {
    let { className , children , nodeViews ={} , customNodeViews , ...props } = param;
    const [mount, setMount] = useState(null);
    const editor = useEditor(mount, {
        ...props,
        nodeViews: customNodeViews
    });
    const innerDecos = editor.view ? viewDecorations(editor.view, editor.cursorWrapper) : DecorationSet.empty;
    const outerDecos = editor.view ? computeDocDeco(editor.view) : [];
    return /*#__PURE__*/ React.createElement(EditorContext.Provider, {
        value: editor
    }, /*#__PURE__*/ React.createElement(NodeViewContext.Provider, {
        value: {
            nodeViews
        }
    }, /*#__PURE__*/ React.createElement(DocNodeViewContext.Provider, {
        value: {
            className: className,
            setMount: setMount,
            node: editor.view?.state.doc,
            innerDeco: innerDecos,
            outerDeco: outerDecos,
            viewDesc: editor.docViewDescRef.current
        }
    }, children)));
}
export function ProseMirror(props) {
    return /*#__PURE__*/ React.createElement(LayoutGroup, null, /*#__PURE__*/ React.createElement(ProseMirrorInner, _extends({}, props)));
}