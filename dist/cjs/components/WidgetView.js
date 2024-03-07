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
    let { widget , pos  } = param;
    const siblingDescriptors = (0, _react.useContext)(_childDescriptorsContextJs.ChildDescriptorsContext);
    const domRef = (0, _react.useRef)(null);
    (0, _react.useLayoutEffect)(()=>{
        if (!domRef.current) return;
        const desc = new _viewdescJs.WidgetViewDesc(undefined, widget, domRef.current);
        siblingDescriptors.push(desc);
    });
    const { Component  } = widget.type;
    return Component && /*#__PURE__*/ _react.default.createElement(Component, {
        ref: domRef,
        widget: widget,
        pos: pos,
        contentEditable: false
    });
}
