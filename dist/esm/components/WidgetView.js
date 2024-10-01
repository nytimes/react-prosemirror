import React, { useContext, useLayoutEffect, useRef } from "react";
import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { WidgetViewDesc } from "../viewdesc.js";
export function WidgetView(param) {
    let { widget , getPos  } = param;
    const { siblingsRef , parentRef  } = useContext(ChildDescriptorsContext);
    const viewDescRef = useRef(null);
    const getPosFunc = useRef(()=>getPos.current()).current;
    const domRef = useRef(null);
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
    useLayoutEffect(()=>{
        if (!domRef.current) return;
        if (!viewDescRef.current) {
            viewDescRef.current = new WidgetViewDesc(parentRef.current, getPos.current(), widget, domRef.current);
        } else {
            viewDescRef.current.parent = parentRef.current;
            viewDescRef.current.widget = widget;
            viewDescRef.current.pos = getPos.current();
            viewDescRef.current.dom = domRef.current;
        }
        if (!siblingsRef.current.includes(viewDescRef.current)) {
            siblingsRef.current.push(viewDescRef.current);
        }
        siblingsRef.current.sort((a, b)=>a.pos - b.pos);
    });
    const { Component  } = widget.type;
    return Component && /*#__PURE__*/ React.createElement(Component, {
        ref: domRef,
        widget: widget,
        getPos: getPosFunc,
        contentEditable: false
    });
}
