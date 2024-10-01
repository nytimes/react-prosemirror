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
    let { widget , getPos  } = param;
    const { siblingsRef , parentRef  } = (0, _react.useContext)(_childDescriptorsContextJs.ChildDescriptorsContext);
    const viewDescRef = (0, _react.useRef)(null);
    const rootDomRef = (0, _react.useRef)(null);
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
    (0, _useEditorEffectJs.useEditorEffect)((view)=>{
        if (!rootDomRef.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const toDOM = widget.type.toDOM;
        let dom = typeof toDOM === "function" ? toDOM(view, ()=>getPos.current()) : toDOM;
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
        if (!viewDescRef.current) {
            viewDescRef.current = new _viewdescJs.WidgetViewDesc(parentRef.current, getPos.current(), widget, rootDomRef.current);
        } else {
            viewDescRef.current.parent = parentRef.current;
            viewDescRef.current.widget = widget;
            viewDescRef.current.pos = getPos.current();
            viewDescRef.current.dom = rootDomRef.current;
        }
        if (!siblingsRef.current.includes(viewDescRef.current)) {
            siblingsRef.current.push(viewDescRef.current);
        }
        siblingsRef.current.sort((a, b)=>a.pos - b.pos);
    });
    return /*#__PURE__*/ _react.default.createElement("span", {
        ref: rootDomRef
    });
}
