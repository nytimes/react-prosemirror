"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "WidgetView", {
    enumerable: true,
    get: ()=>WidgetView
});
const _react = /*#__PURE__*/ _interopRequireWildcard(require("react"));
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
function WidgetView(param) {
    let { widget , getPos  } = param;
    const { siblingsRef , parentRef  } = (0, _react.useContext)(_childDescriptorsContextJs.ChildDescriptorsContext);
    const viewDescRef = (0, _react.useRef)(null);
    const getPosFunc = (0, _react.useRef)(()=>getPos.current()).current;
    const domRef = (0, _react.useRef)(null);
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
        if (!domRef.current) return;
        if (!viewDescRef.current) {
            viewDescRef.current = new _viewdescJs.WidgetViewDesc(parentRef.current, ()=>getPos.current(), widget, domRef.current);
        } else {
            viewDescRef.current.parent = parentRef.current;
            viewDescRef.current.widget = widget;
            viewDescRef.current.getPos = ()=>getPos.current();
            viewDescRef.current.dom = domRef.current;
        }
        if (!siblingsRef.current.includes(viewDescRef.current)) {
            siblingsRef.current.push(viewDescRef.current);
        }
        siblingsRef.current.sort((a, b)=>a.getPos() - b.getPos());
    });
    const { Component  } = widget.type;
    return Component && /*#__PURE__*/ _react.default.createElement(Component, {
        ref: domRef,
        widget: widget,
        getPos: getPosFunc,
        contentEditable: false
    });
}
