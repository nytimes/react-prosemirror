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
const MarkView = /*#__PURE__*/ (0, _react.forwardRef)(function MarkView(param, ref) {
    let { mark , children  } = param;
    const siblingDescriptors = (0, _react.useContext)(_childDescriptorsContextJs.ChildDescriptorsContext);
    const childDescriptors = [];
    const domRef = (0, _react.useRef)(null);
    (0, _react.useImperativeHandle)(ref, ()=>{
        return domRef.current;
    }, []);
    const outputSpec = mark.type.spec.toDOM?.(mark, true);
    if (!outputSpec) throw new Error(`Mark spec for ${mark.type.name} is missing toDOM`);
    (0, _react.useLayoutEffect)(()=>{
        if (!domRef.current) return;
        const firstChildDesc = childDescriptors[0];
        const desc = new _viewdescJs.MarkViewDesc(undefined, childDescriptors, mark, domRef.current, firstChildDesc?.dom.parentElement ?? domRef.current);
        siblingDescriptors.push(desc);
        for (const childDesc of childDescriptors){
            childDesc.parent = desc;
        }
    });
    return /*#__PURE__*/ _react.default.createElement(_outputSpecJs.OutputSpec, {
        ref: domRef,
        outputSpec: outputSpec
    }, /*#__PURE__*/ _react.default.createElement(_childDescriptorsContextJs.ChildDescriptorsContext.Provider, {
        value: childDescriptors
    }, children));
});
