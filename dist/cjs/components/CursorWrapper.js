"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CursorWrapper", {
    enumerable: true,
    get: ()=>CursorWrapper
});
const _react = /*#__PURE__*/ _interopRequireWildcard(require("react"));
const _domJs = require("../dom.js");
const _useEditorEffectJs = require("../hooks/useEditorEffect.js");
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
const CursorWrapper = /*#__PURE__*/ (0, _react.forwardRef)(function CursorWrapper(param, ref) {
    let { widget , getPos , ...props } = param;
    const [shouldRender, setShouldRender] = (0, _react.useState)(true);
    const innerRef = (0, _react.useRef)(null);
    (0, _react.useImperativeHandle)(ref, ()=>{
        return innerRef.current;
    }, []);
    (0, _useEditorEffectJs.useEditorEffect)((view)=>{
        if (!view || !innerRef.current) return;
        // @ts-expect-error Internal property - domObserver
        view.domObserver.disconnectSelection();
        // @ts-expect-error Internal property - domSelection
        const domSel = view.domSelection();
        const range = document.createRange();
        const node = innerRef.current;
        const img = node.nodeName == "IMG";
        if (img && node.parentNode) {
            range.setEnd(node.parentNode, (0, _domJs.domIndex)(node) + 1);
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
    return shouldRender ? /*#__PURE__*/ _react.default.createElement("img", _extends({
        ref: innerRef,
        className: "ProseMirror-separator",
        // eslint-disable-next-line react/no-unknown-property
        "mark-placeholder": "true",
        alt: ""
    }, props)) : null;
});
