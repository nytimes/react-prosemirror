"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "NativeWidgetView", {
    enumerable: true,
    get: ()=>NativeWidgetView
});
const _react = /*#__PURE__*/ _interopRequireWildcard(require("react"));
const _childDescriptorsContextJs = require("../contexts/ChildDescriptorsContext.js");
const _useEditorEffectJs = require("../hooks/useEditorEffect.js");
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
function NativeWidgetView(param) {
    let { widget , pos  } = param;
    const siblingDescriptors = (0, _react.useContext)(_childDescriptorsContextJs.ChildDescriptorsContext);
    const rootDomRef = (0, _react.useRef)(null);
    const posRef = (0, _react.useRef)(pos);
    posRef.current = pos;
    (0, _useEditorEffectJs.useEditorEffect)((view)=>{
        if (!rootDomRef.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const toDOM = widget.type.toDOM;
        let dom = typeof toDOM === "function" ? toDOM(view, ()=>posRef.current) : toDOM;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!widget.type.spec.raw) {
            if (dom.nodeType != 1) {
                const wrap = document.createElement("span");
                wrap.appendChild(dom);
                dom = wrap;
            }
            dom.contentEditable = "false";
            dom.classList.add("ProseMirror-widget");
        }
        if (rootDomRef.current.firstElementChild === dom) return;
        rootDomRef.current.replaceChildren(dom);
    });
    (0, _react.useLayoutEffect)(()=>{
        if (!rootDomRef.current) return;
        const desc = new _viewdescJs.WidgetViewDesc(undefined, widget, rootDomRef.current);
        siblingDescriptors.push(desc);
    });
    return /*#__PURE__*/ _react.default.createElement("span", {
        ref: rootDomRef
    });
}
