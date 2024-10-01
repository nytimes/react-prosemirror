import React, { useContext, useLayoutEffect, useRef } from "react";
import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { useEditorEffect } from "../hooks/useEditorEffect.js";
import { WidgetViewDesc } from "../viewdesc.js";
export function NativeWidgetView(param) {
    let { widget , getPos  } = param;
    const { siblingsRef , parentRef  } = useContext(ChildDescriptorsContext);
    const viewDescRef = useRef(null);
    const rootDomRef = useRef(null);
    useLayoutEffect(()=>{
        const siblings = siblingsRef.current;
        return ()=>{
            if (!viewDescRef.current) return;
            if (siblings.includes(viewDescRef.current)) {
                const index = siblings.indexOf(viewDescRef.current);
                siblings.splice(index, 1);
            }
        };
    }, [
        siblingsRef
    ]);
    useEditorEffect((view)=>{
        if (!rootDomRef.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const toDOM = widget.type.toDOM;
        let dom = typeof toDOM === "function" ? toDOM(view, ()=>getPos.current()) : toDOM;
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
        if (!viewDescRef.current) {
            viewDescRef.current = new WidgetViewDesc(parentRef.current, getPos.current(), widget, rootDomRef.current);
        } else {
            viewDescRef.current.parent = parentRef.current;
            viewDescRef.current.widget = widget;
            viewDescRef.current.pos = getPos.current();
            viewDescRef.current.dom = rootDomRef.current;
        }
        if (!siblingsRef.current.includes(viewDescRef.current)) {
            siblingsRef.current.push(viewDescRef.current);
        }
        siblingsRef.current.sort((a, b)=>a.pos - b.pos);
    });
    return /*#__PURE__*/ React.createElement("span", {
        ref: rootDomRef
    });
}
