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
function SeparatorHackView() {
    const siblingDescriptors = (0, _react.useContext)(_childDescriptorsContextJs.ChildDescriptorsContext);
    const ref = (0, _react.useRef)(null);
    const [shouldRender, setShouldRender] = (0, _react.useState)(false);
    // There's no risk of an infinite loop here, because
    // we call setShouldRender conditionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
    (0, _react.useLayoutEffect)(()=>{
        const lastSibling = siblingDescriptors[siblingDescriptors.length - 1];
        if ((_browserJs.browser.safari || _browserJs.browser.chrome) && (lastSibling?.dom)?.contentEditable == "false") {
            setShouldRender(true);
            return;
        }
        if (!ref.current) return;
        const desc = new _viewdescJs.TrailingHackViewDesc(undefined, [], ref.current, null);
        siblingDescriptors.push(desc);
    });
    return shouldRender ? /*#__PURE__*/ _react.default.createElement("img", {
        ref: ref,
        className: "ProseMirror-separator"
    }) : null;
}
