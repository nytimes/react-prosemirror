"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TrailingHackView", {
    enumerable: true,
    get: function() {
        return TrailingHackView;
    }
});
const _react = /*#__PURE__*/ _interop_require_wildcard(require("react"));
const _ChildDescriptorsContext = require("../contexts/ChildDescriptorsContext.js");
const _viewdesc = require("../viewdesc.js");
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
function TrailingHackView(param) {
    let { getPos } = param;
    const { siblingsRef, parentRef } = (0, _react.useContext)(_ChildDescriptorsContext.ChildDescriptorsContext);
    const viewDescRef = (0, _react.useRef)(null);
    const ref = (0, _react.useRef)(null);
    (0, _react.useLayoutEffect)(()=>{
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
    (0, _react.useLayoutEffect)(()=>{
        if (!ref.current) return;
        if (!viewDescRef.current) {
            viewDescRef.current = new _viewdesc.TrailingHackViewDesc(parentRef.current, [], ()=>getPos.current(), ref.current, null);
        } else {
            viewDescRef.current.parent = parentRef.current;
            viewDescRef.current.dom = ref.current;
            viewDescRef.current.getPos = ()=>getPos.current();
        }
        if (!siblingsRef.current.includes(viewDescRef.current)) {
            siblingsRef.current.push(viewDescRef.current);
        }
        siblingsRef.current.sort(_viewdesc.sortViewDescs);
    });
    return /*#__PURE__*/ _react.default.createElement("br", {
        ref: ref,
        className: "ProseMirror-trailingBreak"
    });
}