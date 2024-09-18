import { useCallback, useContext, useLayoutEffect, useRef } from "react";
import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { NodeViewDesc } from "../viewdesc.js";
export function useNodeViewDescriptor(node, domRef, nodeDomRef, innerDecorations, outerDecorations, viewDesc, contentDOMRef) {
    const nodeViewDescRef = useRef(viewDesc);
    const stopEvent = useRef(()=>false);
    const setStopEvent = useCallback((newStopEvent)=>{
        stopEvent.current = newStopEvent;
    }, []);
    const siblingDescriptors = useContext(ChildDescriptorsContext);
    const childDescriptors = [];
    useLayoutEffect(()=>{
        if (!node || !nodeDomRef.current) return;
        const firstChildDesc = childDescriptors[0];
        if (!nodeViewDescRef.current) {
            nodeViewDescRef.current = new NodeViewDesc(undefined, childDescriptors, node, outerDecorations, innerDecorations, domRef?.current ?? nodeDomRef.current, firstChildDesc?.dom.parentElement ?? null, nodeDomRef.current, (event)=>!!stopEvent.current(event));
        } else {
            nodeViewDescRef.current.parent = undefined;
            nodeViewDescRef.current.children = childDescriptors;
            nodeViewDescRef.current.node = node;
            nodeViewDescRef.current.outerDeco = outerDecorations;
            nodeViewDescRef.current.innerDeco = innerDecorations;
            nodeViewDescRef.current.dom = domRef?.current ?? nodeDomRef.current;
            // @ts-expect-error We have our own ViewDesc implementations
            nodeViewDescRef.current.dom.pmViewDesc = nodeViewDescRef.current;
            nodeViewDescRef.current.contentDOM = // If there's already a contentDOM, we can just
            // keep it; it won't have changed. This is especially
            // important during compositions, where the
            // firstChildDesc might not have a correct dom node set yet.
            contentDOMRef?.current ?? nodeViewDescRef.current.contentDOM ?? firstChildDesc?.dom.parentElement ?? null;
            nodeViewDescRef.current.nodeDOM = nodeDomRef.current;
        }
        siblingDescriptors.push(nodeViewDescRef.current);
        for (const childDesc of childDescriptors){
            childDesc.parent = nodeViewDescRef.current;
        }
    });
    return {
        childDescriptors,
        setStopEvent
    };
}
