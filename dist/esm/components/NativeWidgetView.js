import React, { useContext, useLayoutEffect, useRef } from "react";
import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { useEditorEffect } from "../hooks/useEditorEffect.js";
import { WidgetViewDesc } from "../viewdesc.js";
export function NativeWidgetView(param) {
    let { widget , pos  } = param;
    const siblingDescriptors = useContext(ChildDescriptorsContext);
    const rootDomRef = useRef(null);
    const posRef = useRef(pos);
    posRef.current = pos;
    useEditorEffect((view)=>{
        if (!rootDomRef.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const toDOM = widget.type.toDOM;
        let dom = typeof toDOM === "function" ? toDOM(view, ()=>posRef.current) : toDOM;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!widget.type.spec.raw) {
            if (dom.nodeType != 1) {
                const wrap = document.createElement("span");
                wrap.appendChild(dom);
                dom = wrap;
            }
            dom.contentEditable = "false";
            dom.classList.add("ProseMirror-widget");
        }
        if (rootDomRef.current.firstElementChild === dom) return;
        rootDomRef.current.replaceChildren(dom);
    });
    useLayoutEffect(()=>{
        if (!rootDomRef.current) return;
        const desc = new WidgetViewDesc(undefined, widget, rootDomRef.current);
        siblingDescriptors.push(desc);
    });
    return /*#__PURE__*/ React.createElement("span", {
        ref: rootDomRef
    });
}
