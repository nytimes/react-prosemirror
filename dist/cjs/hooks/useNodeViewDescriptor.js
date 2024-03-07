"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useNodeViewDescriptor", {
    enumerable: true,
    get: ()=>useNodeViewDescriptor
});
const _react = require("react");
const _childDescriptorsContextJs = require("../contexts/ChildDescriptorsContext.js");
const _viewdescJs = require("../viewdesc.js");
function useNodeViewDescriptor(node, domRef, nodeDomRef, innerDecorations, outerDecorations, viewDesc, contentDOMRef) {
    const nodeViewDescRef = (0, _react.useRef)(viewDesc);
    const siblingDescriptors = (0, _react.useContext)(_childDescriptorsContextJs.ChildDescriptorsContext);
    const childDescriptors = [];
    (0, _react.useLayoutEffect)(()=>{
        if (!node || !nodeDomRef.current) return;
        const firstChildDesc = childDescriptors[0];
        if (!nodeViewDescRef.current) {
            nodeViewDescRef.current = new _viewdescJs.NodeViewDesc(undefined, childDescriptors, node, outerDecorations, innerDecorations, domRef?.current ?? nodeDomRef.current, firstChildDesc?.dom.parentElement ?? null, nodeDomRef.current);
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
    return childDescriptors;
}
