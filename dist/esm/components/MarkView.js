import React, { forwardRef, memo, useContext, useImperativeHandle, useLayoutEffect, useMemo, useRef } from "react";
import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { MarkViewDesc } from "../viewdesc.js";
import { OutputSpec } from "./OutputSpec.js";
export const MarkView = /*#__PURE__*/ memo(/*#__PURE__*/ forwardRef(function MarkView(param, ref) {
    let { mark , getPos , children  } = param;
    const { siblingsRef , parentRef  } = useContext(ChildDescriptorsContext);
    const viewDescRef = useRef(undefined);
    const childDescriptors = useRef([]);
    const domRef = useRef(null);
    useImperativeHandle(ref, ()=>{
        return domRef.current;
    }, []);
    const outputSpec = useMemo(()=>mark.type.spec.toDOM?.(mark, true), [
        mark
    ]);
    if (!outputSpec) throw new Error(`Mark spec for ${mark.type.name} is missing toDOM`);
    useLayoutEffect(()=>{
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
    useLayoutEffect(()=>{
        if (!domRef.current) return;
        const firstChildDesc = childDescriptors.current[0];
        if (!viewDescRef.current) {
            viewDescRef.current = new MarkViewDesc(parentRef.current, childDescriptors.current, getPos.current(), mark, domRef.current, firstChildDesc?.dom.parentElement ?? domRef.current);
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
    const childContextValue = useMemo(()=>({
            parentRef: viewDescRef,
            siblingsRef: childDescriptors
        }), [
        childDescriptors,
        viewDescRef
    ]);
    return /*#__PURE__*/ React.createElement(OutputSpec, {
        ref: domRef,
        outputSpec: outputSpec
    }, /*#__PURE__*/ React.createElement(ChildDescriptorsContext.Provider, {
        value: childContextValue
    }, children));
}));
