import React, { useContext, useLayoutEffect, useRef } from "react";
import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { TrailingHackViewDesc } from "../viewdesc.js";
export function TrailingHackView(param) {
    let { getPos  } = param;
    const { siblingsRef , parentRef  } = useContext(ChildDescriptorsContext);
    const viewDescRef = useRef(null);
    const ref = useRef(null);
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
        if (!ref.current) return;
        if (!viewDescRef.current) {
            viewDescRef.current = new TrailingHackViewDesc(parentRef.current, [], ()=>getPos.current(), ref.current, null);
        } else {
            viewDescRef.current.parent = parentRef.current;
            viewDescRef.current.dom = ref.current;
            viewDescRef.current.getPos = ()=>getPos.current();
        }
        if (!siblingsRef.current.includes(viewDescRef.current)) {
            siblingsRef.current.push(viewDescRef.current);
        }
        siblingsRef.current.sort((a, b)=>a.getPos() - b.getPos());
    });
    return /*#__PURE__*/ React.createElement("br", {
        ref: ref,
        className: "ProseMirror-trailingBreak"
    });
}
