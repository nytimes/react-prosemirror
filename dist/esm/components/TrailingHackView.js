import React, { useContext, useLayoutEffect, useRef } from "react";
import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { TrailingHackViewDesc } from "../viewdesc.js";
export function TrailingHackView() {
    const siblingDescriptors = useContext(ChildDescriptorsContext);
    const ref = useRef(null);
    useLayoutEffect(()=>{
        if (!ref.current) return;
        const desc = new TrailingHackViewDesc(undefined, [], ref.current, null);
        siblingDescriptors.push(desc);
    });
    return /*#__PURE__*/ React.createElement("br", {
        ref: ref,
        className: "ProseMirror-trailingBreak"
    });
}
