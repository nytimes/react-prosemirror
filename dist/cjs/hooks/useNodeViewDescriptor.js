"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useNodeViewDescriptor", {
    enumerable: true,
    get: function() {
        return useNodeViewDescriptor;
    }
});
const _react = require("react");
const _ChildDescriptorsContext = require("../contexts/ChildDescriptorsContext.js");
const _EditorContext = require("../contexts/EditorContext.js");
const _viewdesc = require("../viewdesc.js");
function useNodeViewDescriptor(node, getPos, domRef, nodeDomRef, innerDecorations, outerDecorations, viewDesc, contentDOMRef) {
    const { view } = (0, _react.useContext)(_EditorContext.EditorContext);
    const [hasContentDOM, setHasContentDOM] = (0, _react.useState)(true);
    const nodeViewDescRef = (0, _react.useRef)(viewDesc);
    const stopEvent = (0, _react.useRef)(()=>false);
    const setStopEvent = (0, _react.useCallback)((newStopEvent)=>{
        stopEvent.current = newStopEvent;
    }, []);
    const selectNode = (0, _react.useRef)(()=>{
        if (!nodeDomRef.current || !node) return;
        if (nodeDomRef.current.nodeType == 1) nodeDomRef.current.classList.add("ProseMirror-selectednode");
        if (contentDOMRef?.current || !node.type.spec.draggable) (domRef?.current ?? nodeDomRef.current).draggable = true;
    });
    const deselectNode = (0, _react.useRef)(()=>{
        if (!nodeDomRef.current || !node) return;
        if (nodeDomRef.current.nodeType == 1) {
            nodeDomRef.current.classList.remove("ProseMirror-selectednode");
            if (contentDOMRef?.current || !node.type.spec.draggable) (domRef?.current ?? nodeDomRef.current).removeAttribute("draggable");
        }
    });
    const setSelectNode = (0, _react.useCallback)((newSelectNode, newDeselectNode)=>{
        selectNode.current = newSelectNode;
        deselectNode.current = newDeselectNode;
    }, []);
    const { siblingsRef, parentRef } = (0, _react.useContext)(_ChildDescriptorsContext.ChildDescriptorsContext);
    const childDescriptors = (0, _react.useRef)([]);
    (0, _react.useLayoutEffect)(()=>{
        const siblings = siblingsRef.current;
        return ()=>{
            if (!nodeViewDescRef.current) return;
            if (siblings.includes(nodeViewDescRef.current)) {
                const index = siblings.indexOf(nodeViewDescRef.current);
                siblings.splice(index, 1);
            }
        };
    }, [
        siblingsRef
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    (0, _react.useLayoutEffect)(()=>{
        if (!node || !nodeDomRef.current) return;
        const firstChildDesc = childDescriptors.current[0];
        if (!nodeViewDescRef.current) {
            nodeViewDescRef.current = new _viewdesc.NodeViewDesc(parentRef.current, childDescriptors.current, getPos, node, outerDecorations, innerDecorations, domRef?.current ?? nodeDomRef.current, firstChildDesc?.dom.parentElement ?? null, nodeDomRef.current, (event)=>!!stopEvent.current(event), ()=>selectNode.current(), ()=>deselectNode.current());
        } else {
            nodeViewDescRef.current.parent = parentRef.current;
            nodeViewDescRef.current.children = childDescriptors.current;
            nodeViewDescRef.current.node = node;
            nodeViewDescRef.current.getPos = getPos;
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
        setHasContentDOM(nodeViewDescRef.current.contentDOM !== null);
        if (!siblingsRef.current.includes(nodeViewDescRef.current)) {
            siblingsRef.current.push(nodeViewDescRef.current);
        }
        siblingsRef.current.sort(_viewdesc.sortViewDescs);
        for (const childDesc of childDescriptors.current){
            childDesc.parent = nodeViewDescRef.current;
            // Because TextNodeViews can't locate the DOM nodes
            // for compositions, we need to override them here
            if (childDesc instanceof _viewdesc.CompositionViewDesc) {
                const compositionTopDOM = nodeViewDescRef.current.contentDOM?.firstChild;
                if (!compositionTopDOM) throw new Error(`Started a composition but couldn't find the text node it belongs to.`);
                let textDOM = compositionTopDOM;
                while(textDOM.firstChild){
                    textDOM = textDOM.firstChild;
                }
                if (!textDOM || !(textDOM instanceof Text)) throw new Error(`Started a composition but couldn't find the text node it belongs to.`);
                childDesc.dom = compositionTopDOM;
                childDesc.textDOM = textDOM;
                childDesc.text = textDOM.data;
                // @ts-expect-error ???
                childDesc.textDOM.pmViewDesc = childDesc;
                // @ts-expect-error ???
                view?.input.compositionNodes.push(childDesc);
            }
        }
        return ()=>{
            if (nodeViewDescRef.current?.children[0] instanceof _viewdesc.CompositionViewDesc && !view?.composing) {
                nodeViewDescRef.current?.children[0].dom.parentNode?.removeChild(nodeViewDescRef.current?.children[0].dom);
            }
        };
    });
    return {
        hasContentDOM,
        childDescriptors,
        nodeViewDescRef,
        setStopEvent,
        setSelectNode
    };
}