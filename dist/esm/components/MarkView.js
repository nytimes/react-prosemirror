import React, { forwardRef, useContext, useImperativeHandle, useLayoutEffect, useRef } from "react";
import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { MarkViewDesc } from "../viewdesc.js";
import { OutputSpec } from "./OutputSpec.js";
export const MarkView = /*#__PURE__*/ forwardRef(function MarkView(param, ref) {
    let { mark , children  } = param;
    const siblingDescriptors = useContext(ChildDescriptorsContext);
    const childDescriptors = [];
    const domRef = useRef(null);
    useImperativeHandle(ref, ()=>{
        return domRef.current;
    }, []);
    const outputSpec = mark.type.spec.toDOM?.(mark, true);
    if (!outputSpec) throw new Error(`Mark spec for ${mark.type.name} is missing toDOM`);
    useLayoutEffect(()=>{
        if (!domRef.current) return;
        const firstChildDesc = childDescriptors[0];
        const desc = new MarkViewDesc(undefined, childDescriptors, mark, domRef.current, firstChildDesc?.dom.parentElement ?? domRef.current);
        siblingDescriptors.push(desc);
        for (const childDesc of childDescriptors){
            childDesc.parent = desc;
        }
    });
    return /*#__PURE__*/ React.createElement(OutputSpec, {
        ref: domRef,
        outputSpec: outputSpec
    }, /*#__PURE__*/ React.createElement(ChildDescriptorsContext.Provider, {
        value: childDescriptors
    }, children));
});
