"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SeparatorHackView", {
    enumerable: true,
    get: ()=>SeparatorHackView
});
const _react = /*#__PURE__*/ _interopRequireWildcard(require("react"));
const _browserJs = require("../browser.js");
const _childDescriptorsContextJs = require("../contexts/ChildDescriptorsContext.js");
const _viewdescJs = require("../viewdesc.js");
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
function SeparatorHackView(param) {
    let { getPos  } = param;
    const { siblingsRef , parentRef  } = (0, _react.useContext)(_childDescriptorsContextJs.ChildDescriptorsContext);
    const viewDescRef = (0, _react.useRef)(null);
    const ref = (0, _react.useRef)(null);
    const [shouldRender, setShouldRender] = (0, _react.useState)(false);
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
    // There's no risk of an infinite loop here, because
    // we call setShouldRender conditionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
    (0, _react.useLayoutEffect)(()=>{
        const lastSibling = siblingsRef.current[siblingsRef.current.length - 1];
        if ((_browserJs.browser.safari || _browserJs.browser.chrome) && (lastSibling?.dom)?.contentEditable == "false") {
            setShouldRender(true);
            return;
        }
        if (!ref.current) return;
        if (!viewDescRef.current) {
            viewDescRef.current = new _viewdescJs.TrailingHackViewDesc(parentRef.current, [], ()=>getPos.current(), ref.current, null);
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
    return shouldRender ? /*#__PURE__*/ _react.default.createElement("img", {
        ref: ref,
        className: "ProseMirror-separator"
    }) : null;
}
