"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CustomNodeView", {
    enumerable: true,
    get: function() {
        return CustomNodeView;
    }
});
const _react = /*#__PURE__*/ _interop_require_wildcard(require("react"));
const _reactdom = require("react-dom");
const _EditorContext = require("../contexts/EditorContext.js");
const _useClientOnly = require("../hooks/useClientOnly.js");
const _ChildNodeViews = require("./ChildNodeViews.js");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
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
    var newObj = {
        __proto__: null
    };
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
function CustomNodeView(param) {
    let { contentDomRef, customNodeViewRef, customNodeViewRootRef, customNodeView, initialNode, node, getPos, initialOuterDeco, initialInnerDeco, innerDeco } = param;
    const { view } = (0, _react.useContext)(_EditorContext.EditorContext);
    const shouldRender = (0, _useClientOnly.useClientOnly)();
    if (!shouldRender) return null;
    if (!customNodeViewRef.current) {
        customNodeViewRef.current = customNodeView(initialNode.current, // customNodeView will only be set if view is set, and we can only reach
        // this line if customNodeView is set
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        view, ()=>getPos.current(), initialOuterDeco.current, initialInnerDeco.current);
    }
    const { contentDOM } = customNodeViewRef.current;
    contentDomRef.current = contentDOM ?? null;
    return /*#__PURE__*/ (0, _react.createElement)(node.isInline ? "span" : "div", {
        ref: customNodeViewRootRef,
        contentEditable: !!contentDOM,
        suppressContentEditableWarning: true
    }, contentDOM && /*#__PURE__*/ (0, _reactdom.createPortal)(/*#__PURE__*/ _react.default.createElement(_ChildNodeViews.ChildNodeViews, {
        getPos: getPos,
        node: node,
        innerDecorations: innerDeco
    }), contentDOM));
}