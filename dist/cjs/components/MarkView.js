"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "MarkView", {
    enumerable: true,
    get: ()=>MarkView
});
const _react = /*#__PURE__*/ _interopRequireWildcard(require("react"));
const _childDescriptorsContextJs = require("../contexts/ChildDescriptorsContext.js");
const _viewdescJs = require("../viewdesc.js");
const _outputSpecJs = require("./OutputSpec.js");
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
const MarkView = /*#__PURE__*/ (0, _react.memo)(/*#__PURE__*/ (0, _react.forwardRef)(function MarkView(param, ref) {
    let { mark , getPos , children  } = param;
    const { siblingsRef , parentRef  } = (0, _react.useContext)(_childDescriptorsContextJs.ChildDescriptorsContext);
    const viewDescRef = (0, _react.useRef)(undefined);
    const childDescriptors = (0, _react.useRef)([]);
    const domRef = (0, _react.useRef)(null);
    (0, _react.useImperativeHandle)(ref, ()=>{
        return domRef.current;
    }, []);
    const outputSpec = (0, _react.useMemo)(()=>mark.type.spec.toDOM?.(mark, true), [
        mark
    ]);
    if (!outputSpec) throw new Error(`Mark spec for ${mark.type.name} is missing toDOM`);
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
        const firstChildDesc = childDescriptors.current[0];
        if (!viewDescRef.current) {
            viewDescRef.current = new _viewdescJs.MarkViewDesc(parentRef.current, childDescriptors.current, getPos.current(), mark, domRef.current, firstChildDesc?.dom.parentElement ?? domRef.current);
        } else {
            viewDescRef.current.parent = parentRef.current;
            viewDescRef.current.dom = domRef.current;
            viewDescRef.current.contentDOM = firstChildDesc?.dom.parentElement ?? domRef.current;
            viewDescRef.current.mark = mark;
            viewDescRef.current.pos = getPos.current();
        }
        if (!siblingsRef.current.includes(viewDescRef.current)) {
            siblingsRef.current.push(viewDescRef.current);
        }
        siblingsRef.current.sort((a, b)=>a.pos - b.pos);
        for (const childDesc of childDescriptors.current){
            childDesc.parent = viewDescRef.current;
        }
    });
    const childContextValue = (0, _react.useMemo)(()=>({
            parentRef: viewDescRef,
            siblingsRef: childDescriptors
        }), [
        childDescriptors,
        viewDescRef
    ]);
    return /*#__PURE__*/ _react.default.createElement(_outputSpecJs.OutputSpec, {
        ref: domRef,
        outputSpec: outputSpec
    }, /*#__PURE__*/ _react.default.createElement(_childDescriptorsContextJs.ChildDescriptorsContext.Provider, {
        value: childContextValue
    }, children));
}));
