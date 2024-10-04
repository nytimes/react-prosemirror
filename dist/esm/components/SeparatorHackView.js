import React, { useContext, useLayoutEffect, useRef, useState } from "react";
import { browser } from "../browser.js";
import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { TrailingHackViewDesc } from "../viewdesc.js";
export function SeparatorHackView(param) {
    let { getPos  } = param;
    const { siblingsRef , parentRef  } = useContext(ChildDescriptorsContext);
    const viewDescRef = useRef(null);
    const ref = useRef(null);
    const [shouldRender, setShouldRender] = useState(false);
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
    // There's no risk of an infinite loop here, because
    // we call setShouldRender conditionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useLayoutEffect(()=>{
        const lastSibling = siblingsRef.current[siblingsRef.current.length - 1];
        if ((browser.safari || browser.chrome) && (lastSibling?.dom)?.contentEditable == "false") {
            setShouldRender(true);
            return;
        }
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
    return shouldRender ? /*#__PURE__*/ React.createElement("img", {
        ref: ref,
        className: "ProseMirror-separator"
    }) : null;
}
