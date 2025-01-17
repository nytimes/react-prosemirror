import React, { createElement, useContext } from "react";
import { createPortal } from "react-dom";
import { EditorContext } from "../contexts/EditorContext.js";
import { useClientOnly } from "../hooks/useClientOnly.js";
import { ChildNodeViews } from "./ChildNodeViews.js";
export function CustomNodeView(param) {
    let { contentDomRef , customNodeViewRef , customNodeViewRootRef , customNodeView , initialNode , node , getPos , initialOuterDeco , initialInnerDeco , innerDeco  } = param;
    const { view  } = useContext(EditorContext);
    const shouldRender = useClientOnly();
    if (!shouldRender) return null;
    if (!customNodeViewRef.current) {
        customNodeViewRef.current = customNodeView(initialNode.current, // customNodeView will only be set if view is set, and we can only reach
        // this line if customNodeView is set
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        view, ()=>getPos.current(), initialOuterDeco.current, initialInnerDeco.current);
    }
    const { contentDOM  } = customNodeViewRef.current;
    contentDomRef.current = contentDOM ?? null;
    return /*#__PURE__*/ createElement(node.isInline ? "span" : "div", {
        ref: customNodeViewRootRef,
        contentEditable: !!contentDOM,
        suppressContentEditableWarning: true
    }, contentDOM && /*#__PURE__*/ createPortal(/*#__PURE__*/ React.createElement(ChildNodeViews, {
        getPos: getPos,
        node: node,
        innerDecorations: innerDeco
    }), contentDOM));
}
