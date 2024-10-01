// TODO: I must be missing something, but I do not know why
// this linting rule is only broken in this file
/* eslint-disable react/prop-types */ import React, { cloneElement, createElement, forwardRef, memo, useImperativeHandle, useMemo, useRef } from "react";
import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { useNodeViewDescriptor } from "../hooks/useNodeViewDescriptor.js";
import { ChildNodeViews, wrapInDeco } from "./ChildNodeViews.js";
const getPos = {
    current () {
        return -1;
    }
};
export const DocNodeView = /*#__PURE__*/ memo(/*#__PURE__*/ forwardRef(function DocNodeView(param, ref) {
    let { className , node , innerDeco , outerDeco , as , viewDesc , ...elementProps } = param;
    const innerRef = useRef(null);
    useImperativeHandle(ref, ()=>{
        return innerRef.current;
    }, []);
    const { childDescriptors , nodeViewDescRef  } = useNodeViewDescriptor(node, ()=>getPos.current(), innerRef, innerRef, innerDeco, outerDeco, viewDesc);
    const childContextValue = useMemo(()=>({
            parentRef: nodeViewDescRef,
            siblingsRef: childDescriptors
        }), [
        childDescriptors,
        nodeViewDescRef
    ]);
    const props = {
        ...elementProps,
        ref: innerRef,
        className,
        suppressContentEditableWarning: true
    };
    const element = as ? /*#__PURE__*/ cloneElement(as, props, /*#__PURE__*/ React.createElement(ChildDescriptorsContext.Provider, {
        value: childContextValue
    }, /*#__PURE__*/ React.createElement(ChildNodeViews, {
        getPos: getPos,
        node: node,
        innerDecorations: innerDeco
    }))) : /*#__PURE__*/ createElement("div", props, /*#__PURE__*/ React.createElement(ChildDescriptorsContext.Provider, {
        value: childContextValue
    }, /*#__PURE__*/ React.createElement(ChildNodeViews, {
        getPos: getPos,
        node: node,
        innerDecorations: innerDeco
    })));
    if (!node) return element;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodeDecorations = outerDeco.filter((deco)=>!deco.inline);
    if (!nodeDecorations.length) {
        return element;
    }
    const wrapped = nodeDecorations.reduce(wrapInDeco, element);
    return wrapped;
}));
