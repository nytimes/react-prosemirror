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
import React, { createContext, forwardRef, useContext, useImperativeHandle, useMemo, useRef } from "react";
import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { DocNodeView } from "./DocNodeView.js";
export const DocNodeViewContext = /*#__PURE__*/ createContext(null);
function ProseMirrorDoc(param, ref) {
    let { as , ...props } = param;
    const childDescriptors = useRef([]);
    const innerRef = useRef(null);
    const { setMount , ...docProps } = useContext(DocNodeViewContext);
    const viewDescRef = useRef(undefined);
    useImperativeHandle(ref, ()=>{
        return innerRef.current;
    }, []);
    const childContextValue = useMemo(()=>({
            parentRef: viewDescRef,
            siblingsRef: childDescriptors
        }), [
        childDescriptors,
        viewDescRef
    ]);
    return /*#__PURE__*/ React.createElement(ChildDescriptorsContext.Provider, {
        value: childContextValue
    }, /*#__PURE__*/ React.createElement(DocNodeView, _extends({
        ref: (el)=>{
            innerRef.current = el;
            setMount(el);
        }
    }, props, docProps, {
        as: as
    })));
}
const ForwardedProseMirrorDoc = /*#__PURE__*/ forwardRef(ProseMirrorDoc);
export { ForwardedProseMirrorDoc as ProseMirrorDoc };
