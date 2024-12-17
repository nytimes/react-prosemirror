import React, { createContext, forwardRef, useContext, useImperativeHandle, useMemo, useRef } from "react";
import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { DocNodeView } from "./DocNodeView.js";
export const DocNodeViewContext = /*#__PURE__*/ createContext(null);
function ProseMirrorDoc(param, ref) {
    let { as, ...props } = param;
    const childDescriptors = useRef([]);
    const innerRef = useRef(null);
    const { setMount, ...docProps } = useContext(DocNodeViewContext);
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
    }, /*#__PURE__*/ React.createElement(DocNodeView, {
        ref: (el)=>{
            innerRef.current = el;
            setMount(el);
        },
        ...props,
        ...docProps,
        as: as
    }));
}
const ForwardedProseMirrorDoc = /*#__PURE__*/ forwardRef(ProseMirrorDoc);
export { ForwardedProseMirrorDoc as ProseMirrorDoc };
