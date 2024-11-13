// TODO: I must be missing something, but I do not know why
// this linting rule is only broken in this file
/* eslint-disable react/prop-types */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DocNodeView", {
    enumerable: true,
    get: ()=>DocNodeView
});
const _react = /*#__PURE__*/ _interopRequireWildcard(require("react"));
const _childDescriptorsContextJs = require("../contexts/ChildDescriptorsContext.js");
const _useNodeViewDescriptorJs = require("../hooks/useNodeViewDescriptor.js");
const _childNodeViewsJs = require("./ChildNodeViews.js");
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
const getPos = {
    current () {
        return -1;
    }
};
const DocNodeView = /*#__PURE__*/ (0, _react.memo)(/*#__PURE__*/ (0, _react.forwardRef)(function DocNodeView(param, ref) {
    let { className , node , innerDeco , outerDeco , as , viewDesc , ...elementProps } = param;
    const innerRef = (0, _react.useRef)(null);
    (0, _react.useImperativeHandle)(ref, ()=>{
        return innerRef.current;
    }, []);
    const { childDescriptors , nodeViewDescRef  } = (0, _useNodeViewDescriptorJs.useNodeViewDescriptor)(node, ()=>getPos.current(), innerRef, innerRef, innerDeco, outerDeco, viewDesc);
    const childContextValue = (0, _react.useMemo)(()=>({
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
    const element = as ? /*#__PURE__*/ (0, _react.cloneElement)(as, props, /*#__PURE__*/ _react.default.createElement(_childDescriptorsContextJs.ChildDescriptorsContext.Provider, {
        value: childContextValue
    }, /*#__PURE__*/ _react.default.createElement(_childNodeViewsJs.ChildNodeViews, {
        getPos: getPos,
        node: node,
        innerDecorations: innerDeco
    }))) : /*#__PURE__*/ (0, _react.createElement)("div", props, /*#__PURE__*/ _react.default.createElement(_childDescriptorsContextJs.ChildDescriptorsContext.Provider, {
        value: childContextValue
    }, /*#__PURE__*/ _react.default.createElement(_childNodeViewsJs.ChildNodeViews, {
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
    const wrapped = nodeDecorations.reduce(_childNodeViewsJs.wrapInDeco, element);
    return wrapped;
}));
