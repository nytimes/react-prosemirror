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
import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { domIndex } from "../dom.js";
import { useEditorEffect } from "../hooks/useEditorEffect.js";
export const CursorWrapper = /*#__PURE__*/ forwardRef(function CursorWrapper(param, ref) {
    let { widget , getPos , ...props } = param;
    const [shouldRender, setShouldRender] = useState(true);
    const innerRef = useRef(null);
    useImperativeHandle(ref, ()=>{
        return innerRef.current;
    }, []);
    useEditorEffect((view)=>{
        if (!view || !innerRef.current) return;
        // @ts-expect-error Internal property - domObserver
        view.domObserver.disconnectSelection();
        // @ts-expect-error Internal property - domSelection
        const domSel = view.domSelection();
        const range = document.createRange();
        const node = innerRef.current;
        const img = node.nodeName == "IMG";
        if (img && node.parentNode) {
            range.setEnd(node.parentNode, domIndex(node) + 1);
        } else {
            range.setEnd(node, 0);
        }
        range.collapse(false);
        domSel.removeAllRanges();
        domSel.addRange(range);
        setShouldRender(false);
        // @ts-expect-error Internal property - domObserver
        view.domObserver.connectSelection();
    }, []);
    return shouldRender ? /*#__PURE__*/ React.createElement("img", _extends({
        ref: innerRef,
        className: "ProseMirror-separator",
        // eslint-disable-next-line react/no-unknown-property
        "mark-placeholder": "true",
        alt: ""
    }, props)) : null;
});
