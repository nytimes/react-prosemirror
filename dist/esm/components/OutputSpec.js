import React, { createElement, forwardRef, memo } from "react";
import { htmlAttrsToReactProps, mergeReactProps } from "../props.js";
const ForwardedOutputSpec = /*#__PURE__*/ memo(/*#__PURE__*/ forwardRef(function OutputSpec(param, ref) {
    let { outputSpec , children , ...propOverrides } = param;
    if (typeof outputSpec === "string") {
        return /*#__PURE__*/ React.createElement(React.Fragment, null, outputSpec);
    }
    if (!Array.isArray(outputSpec)) {
        throw new Error("@nytimes/react-prosemirror only supports strings and arrays in toDOM");
    }
    const tagSpec = outputSpec[0];
    const tagName = tagSpec.replace(" ", ":");
    const attrs = outputSpec[1];
    let props = {
        ref,
        ...propOverrides
    };
    let start = 1;
    if (attrs && typeof attrs === "object" && attrs.nodeType == null && !Array.isArray(attrs)) {
        start = 2;
        props = mergeReactProps(htmlAttrsToReactProps(attrs), props);
    }
    const content = [];
    for(let i = start; i < outputSpec.length; i++){
        const child = outputSpec[i];
        if (child === 0) {
            if (i < outputSpec.length - 1 || i > start) {
                throw new RangeError("Content hole must be the only child of its parent node");
            }
            return /*#__PURE__*/ createElement(tagName, props, children);
        }
        content.push(/*#__PURE__*/ React.createElement(ForwardedOutputSpec, {
            outputSpec: child
        }, children));
    }
    return /*#__PURE__*/ createElement(tagName, props, ...content);
}));
export { ForwardedOutputSpec as OutputSpec };
