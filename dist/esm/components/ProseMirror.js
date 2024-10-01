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
import React, { useMemo, useState } from "react";
import { EditorContext } from "../contexts/EditorContext.js";
import { EditorStateContext } from "../contexts/EditorStateContext.js";
import { NodeViewContext } from "../contexts/NodeViewContext.js";
import { computeDocDeco } from "../decorations/computeDocDeco.js";
import { viewDecorations } from "../decorations/viewDecorations.js";
import { useEditor } from "../hooks/useEditor.js";
import { LayoutGroup } from "./LayoutGroup.js";
import { DocNodeViewContext } from "./ProseMirrorDoc.js";
const EMPTY_OUTER_DECOS = [];
function ProseMirrorInner(param) {
    let { className , children , nodeViews ={} , customNodeViews , ...props } = param;
    const [mount, setMount] = useState(null);
    const { editor , state  } = useEditor(mount, {
        ...props,
        nodeViews: customNodeViews
    });
    const innerDecos = editor.view ? viewDecorations(editor.view, editor.cursorWrapper) : DecorationSet.empty;
    const outerDecos = editor.view ? computeDocDeco(editor.view) : EMPTY_OUTER_DECOS;
    const nodeViewContextValue = useMemo(()=>({
            nodeViews
        }), [
        nodeViews
    ]);
    const docNodeViewContextValue = useMemo(()=>({
            className: className,
            setMount: setMount,
            node: editor.view?.state.doc,
            innerDeco: innerDecos,
            outerDeco: outerDecos,
            viewDesc: editor.docViewDescRef.current
        }), [
        className,
        editor.docViewDescRef,
        editor.view?.state.doc,
        innerDecos,
        outerDecos
    ]);
    return /*#__PURE__*/ React.createElement(EditorContext.Provider, {
        value: editor
    }, /*#__PURE__*/ React.createElement(EditorStateContext.Provider, {
        value: state
    }, /*#__PURE__*/ React.createElement(NodeViewContext.Provider, {
        value: nodeViewContextValue
    }, /*#__PURE__*/ React.createElement(DocNodeViewContext.Provider, {
        value: docNodeViewContextValue
    }, children))));
}
export function ProseMirror(props) {
    return /*#__PURE__*/ React.createElement(LayoutGroup, null, /*#__PURE__*/ React.createElement(ProseMirrorInner, _extends({}, props)));
}
