"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    DocNodeViewContext: ()=>DocNodeViewContext,
    ProseMirrorDoc: ()=>ForwardedProseMirrorDoc
});
const _react = /*#__PURE__*/ _interopRequireWildcard(require("react"));
const _childDescriptorsContextJs = require("../contexts/ChildDescriptorsContext.js");
const _docNodeViewJs = require("./DocNodeView.js");
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
const DocNodeViewContext = /*#__PURE__*/ (0, _react.createContext)(null);
function ProseMirrorDoc(param, ref) {
    let { as , ...props } = param;
    const childDescriptors = (0, _react.useRef)([]);
    const innerRef = (0, _react.useRef)(null);
    const { setMount , ...docProps } = (0, _react.useContext)(DocNodeViewContext);
    const viewDescRef = (0, _react.useRef)(undefined);
    (0, _react.useImperativeHandle)(ref, ()=>{
        return innerRef.current;
    }, []);
    const childContextValue = (0, _react.useMemo)(()=>({
            parentRef: viewDescRef,
            siblingsRef: childDescriptors
        }), [
        childDescriptors,
        viewDescRef
    ]);
    return /*#__PURE__*/ _react.default.createElement(_childDescriptorsContextJs.ChildDescriptorsContext.Provider, {
        value: childContextValue
    }, /*#__PURE__*/ _react.default.createElement(_docNodeViewJs.DocNodeView, _extends({
        ref: (el)=>{
            innerRef.current = el;
            setMount(el);
        }
    }, props, docProps, {
        as: as
    })));
}
const ForwardedProseMirrorDoc = /*#__PURE__*/ (0, _react.forwardRef)(ProseMirrorDoc);
