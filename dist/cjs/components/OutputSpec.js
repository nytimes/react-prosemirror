"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "OutputSpec", {
    enumerable: true,
    get: ()=>ForwardedOutputSpec
});
const _react = /*#__PURE__*/ _interopRequireWildcard(require("react"));
const _propsJs = require("../props.js");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interopRequireWildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {};
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
const ForwardedOutputSpec = /*#__PURE__*/ (0, _react.memo)(/*#__PURE__*/ (0, _react.forwardRef)(function OutputSpec(param, ref) {
    let { outputSpec , children , ...propOverrides } = param;
    if (typeof outputSpec === "string") {
        return /*#__PURE__*/ _react.default.createElement(_react.default.Fragment, null, outputSpec);
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
        props = (0, _propsJs.mergeReactProps)((0, _propsJs.htmlAttrsToReactProps)(attrs), props);
    }
    const content = [];
    for(let i = start; i < outputSpec.length; i++){
        const child = outputSpec[i];
        if (child === 0) {
            if (i < outputSpec.length - 1 || i > start) {
                throw new RangeError("Content hole must be the only child of its parent node");
            }
            return /*#__PURE__*/ (0, _react.createElement)(tagName, props, children);
        }
        content.push(/*#__PURE__*/ _react.default.createElement(ForwardedOutputSpec, {
            outputSpec: child
        }, children));
    }
    return /*#__PURE__*/ (0, _react.createElement)(tagName, props, ...content);
}));
