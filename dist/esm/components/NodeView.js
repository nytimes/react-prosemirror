import React, { cloneElement, memo, useContext, useLayoutEffect, useMemo, useRef } from "react";
import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { EditorContext } from "../contexts/EditorContext.js";
import { NodeViewContext } from "../contexts/NodeViewContext.js";
import { SelectNodeContext } from "../contexts/SelectNodeContext.js";
import { StopEventContext } from "../contexts/StopEventContext.js";
import { useNodeViewDescriptor } from "../hooks/useNodeViewDescriptor.js";
import { ChildNodeViews, wrapInDeco } from "./ChildNodeViews.js";
import { CustomNodeView } from "./CustomNodeView.js";
import { MarkView } from "./MarkView.js";
import { OutputSpec } from "./OutputSpec.js";
export const NodeView = /*#__PURE__*/ memo(function NodeView(param) {
    let { outerDeco, getPos, node, innerDeco, ...props } = param;
    const domRef = useRef(null);
    const nodeDomRef = useRef(null);
    const contentDomRef = useRef(null);
    const getPosFunc = useRef(()=>getPos.current()).current;
    // this is ill-conceived; should revisit
    const initialNode = useRef(node);
    const initialOuterDeco = useRef(outerDeco);
    const initialInnerDeco = useRef(innerDeco);
    const customNodeViewRootRef = useRef(null);
    const customNodeViewRef = useRef(null);
    // const state = useEditorState();
    const { nodeViews } = useContext(NodeViewContext);
    const { view } = useContext(EditorContext);
    let element = null;
    const Component = nodeViews[node.type.name];
    const outputSpec = useMemo(()=>node.type.spec.toDOM?.(node), [
        node
    ]);
    // TODO: Would be great to pull all of the custom node view stuff into
    // a hook
    const customNodeView = view?.someProp("nodeViews", (nodeViews)=>nodeViews?.[node.type.name]);
    useLayoutEffect(()=>{
        if (!customNodeViewRef.current || !customNodeViewRootRef.current) return;
        const { dom } = customNodeViewRef.current;
        nodeDomRef.current = customNodeViewRootRef.current;
        customNodeViewRootRef.current.appendChild(dom);
        return ()=>{
            customNodeViewRef.current?.destroy?.();
        };
    }, []);
    useLayoutEffect(()=>{
        if (!customNodeView || !customNodeViewRef.current) return;
        const { destroy, update } = customNodeViewRef.current;
        const updated = update?.call(customNodeViewRef.current, node, outerDeco, innerDeco) ?? true;
        if (updated) return;
        destroy?.call(customNodeViewRef.current);
        if (!customNodeViewRootRef.current) return;
        initialNode.current = node;
        initialOuterDeco.current = outerDeco;
        initialInnerDeco.current = innerDeco;
        customNodeViewRef.current = customNodeView(initialNode.current, // customNodeView will only be set if view is set, and we can only reach
        // this line if customNodeView is set
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        view, ()=>getPos.current(), initialOuterDeco.current, initialInnerDeco.current);
        const { dom } = customNodeViewRef.current;
        nodeDomRef.current = customNodeViewRootRef.current;
        customNodeViewRootRef.current.appendChild(dom);
    }, [
        customNodeView,
        view,
        innerDeco,
        node,
        outerDeco,
        getPos
    ]);
    const { hasContentDOM, childDescriptors, setStopEvent, setSelectNode, nodeViewDescRef } = useNodeViewDescriptor(node, ()=>getPos.current(), domRef, nodeDomRef, innerDeco, outerDeco, undefined, contentDomRef);
    const finalProps = {
        ...props,
        ...!hasContentDOM && {
            contentEditable: false
        }
    };
    const nodeProps = useMemo(()=>({
            node: node,
            getPos: getPosFunc,
            decorations: outerDeco,
            innerDecorations: innerDeco
        }), [
        getPosFunc,
        innerDeco,
        node,
        outerDeco
    ]);
    if (Component) {
        element = /*#__PURE__*/ React.createElement(Component, {
            ...finalProps,
            ref: nodeDomRef,
            nodeProps: nodeProps
        }, /*#__PURE__*/ React.createElement(ChildNodeViews, {
            getPos: getPos,
            node: node,
            innerDecorations: innerDeco
        }));
    } else if (customNodeView) {
        element = /*#__PURE__*/ React.createElement(CustomNodeView, {
            contentDomRef: contentDomRef,
            customNodeView: customNodeView,
            customNodeViewRef: customNodeViewRef,
            customNodeViewRootRef: customNodeViewRootRef,
            initialInnerDeco: initialInnerDeco,
            initialNode: initialNode,
            initialOuterDeco: initialOuterDeco,
            node: node,
            getPos: getPos,
            innerDeco: innerDeco
        });
    } else {
        if (outputSpec) {
            element = /*#__PURE__*/ React.createElement(OutputSpec, {
                ...finalProps,
                ref: nodeDomRef,
                outputSpec: outputSpec
            }, /*#__PURE__*/ React.createElement(ChildNodeViews, {
                getPos: getPos,
                node: node,
                innerDecorations: innerDeco
            }));
        }
    }
    if (!element) {
        throw new Error(`Node spec for ${node.type.name} is missing toDOM`);
    }
    const decoratedElement = /*#__PURE__*/ cloneElement(outerDeco.reduce(wrapInDeco, element), // eslint-disable-next-line @typescript-eslint/no-explicit-any
    outerDeco.some((d)=>d.type.attrs.nodeName) ? {
        ref: domRef
    } : // we've already passed the domRef to the NodeView component
    // as a prop
    undefined);
    // Inline nodes will already be wrapped in marks
    // via the ChildNodeViews component
    const markedElement = node.isInline ? decoratedElement : node.marks.reduce((element, mark)=>/*#__PURE__*/ React.createElement(MarkView, {
            getPos: getPos,
            mark: mark
        }, element), decoratedElement);
    const childContextValue = useMemo(()=>({
            parentRef: nodeViewDescRef,
            siblingsRef: childDescriptors
        }), [
        childDescriptors,
        nodeViewDescRef
    ]);
    return /*#__PURE__*/ React.createElement(SelectNodeContext.Provider, {
        value: setSelectNode
    }, /*#__PURE__*/ React.createElement(StopEventContext.Provider, {
        value: setStopEvent
    }, /*#__PURE__*/ React.createElement(ChildDescriptorsContext.Provider, {
        value: childContextValue
    }, /*#__PURE__*/ cloneElement(markedElement, node.marks.length && !node.isInline || // eslint-disable-next-line @typescript-eslint/no-explicit-any
    outerDeco.some((d)=>d.type.attrs.nodeName) ? {
        ref: domRef
    } : // we've already passed the domRef to the NodeView component
    // as a prop
    undefined))));
});