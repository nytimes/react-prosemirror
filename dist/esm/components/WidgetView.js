import React, { useContext, useLayoutEffect, useRef } from "react";
import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { WidgetViewDesc } from "../viewdesc.js";
export function WidgetView(param) {
    let { widget , pos  } = param;
    const siblingDescriptors = useContext(ChildDescriptorsContext);
    const domRef = useRef(null);
    useLayoutEffect(()=>{
        if (!domRef.current) return;
        const desc = new WidgetViewDesc(undefined, widget, domRef.current);
        siblingDescriptors.push(desc);
    });
    const { Component  } = widget.type;
    return Component && /*#__PURE__*/ React.createElement(Component, {
        ref: domRef,
        widget: widget,
        pos: pos,
        contentEditable: false
    });
}
