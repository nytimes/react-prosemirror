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
const _editorContextJs = require("../contexts/EditorContext.js");
const _viewdescJs = require("../viewdesc.js");
function useNodeViewDescriptor(node, getPos, domRef, nodeDomRef, innerDecorations, outerDecorations, viewDesc, contentDOMRef) {
    const { view  } = (0, _react.useContext)(_editorContextJs.EditorContext);
    const [hasContentDOM, setHasContentDOM] = (0, _react.useState)(true);
    const nodeViewDescRef = (0, _react.useRef)(viewDesc);
    const stopEvent = (0, _react.useRef)(()=>false);
    const setStopEvent = (0, _react.useCallback)((newStopEvent)=>{
        stopEvent.current = newStopEvent;
    }, []);
    const { siblingsRef , parentRef  } = (0, _react.useContext)(_childDescriptorsContextJs.ChildDescriptorsContext);
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
            nodeViewDescRef.current = new _viewdescJs.NodeViewDesc(parentRef.current, childDescriptors.current, getPos, node, outerDecorations, innerDecorations, domRef?.current ?? nodeDomRef.current, firstChildDesc?.dom.parentElement ?? null, nodeDomRef.current, (event)=>!!stopEvent.current(event));
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
        siblingsRef.current.sort((a, b)=>a.getPos() - b.getPos());
        for (const childDesc of childDescriptors.current){
            childDesc.parent = nodeViewDescRef.current;
            // Because TextNodeViews can't locate the DOM nodes
            // for compositions, we need to override them here
            if (childDesc instanceof _viewdescJs.CompositionViewDesc) {
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
            if (nodeViewDescRef.current?.children[0] instanceof _viewdescJs.CompositionViewDesc && !view?.composing) {
                nodeViewDescRef.current?.children[0].dom.parentNode?.removeChild(nodeViewDescRef.current?.children[0].dom);
            }
        };
    });
    return {
        hasContentDOM,
        childDescriptors,
        nodeViewDescRef,
        setStopEvent
    };
}
