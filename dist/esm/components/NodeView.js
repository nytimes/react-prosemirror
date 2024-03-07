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
import { NodeSelection } from "prosemirror-state";
import React, { cloneElement, createElement, useContext, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { EditorContext } from "../contexts/EditorContext.js";
import { NodeViewContext } from "../contexts/NodeViewContext.js";
import { useEditorState } from "../hooks/useEditorState.js";
import { useNodeViewDescriptor } from "../hooks/useNodeViewDescriptor.js";
import { ChildNodeViews, wrapInDeco } from "./ChildNodeViews.js";
import { MarkView } from "./MarkView.js";
import { OutputSpec } from "./OutputSpec.js";
export function NodeView(param) {
    let { outerDeco , pos , node , innerDeco , ...props } = param;
    const domRef = useRef(null);
    const nodeDomRef = useRef(null);
    const contentDomRef = useRef(null);
    // this is ill-conceived; should revisit
    const initialNode = useRef(node);
    const initialOuterDeco = useRef(outerDeco);
    const initialInnerDeco = useRef(innerDeco);
    const posRef = useRef(pos);
    posRef.current = pos;
    const customNodeViewRootRef = useRef(null);
    const customNodeViewRef = useRef(null);
    const state = useEditorState();
    const { nodeViews  } = useContext(NodeViewContext);
    const { view  } = useContext(EditorContext);
    let element = null;
    const Component = nodeViews[node.type.name];
    // TODO: Would be great to pull all of the custom node view stuff into
    // a hook
    const customNodeView = view?.someProp("nodeViews")?.[node.type.name];
    useLayoutEffect(()=>{
        if (!customNodeViewRef.current || !customNodeViewRootRef.current) return;
        const { dom  } = customNodeViewRef.current;
        nodeDomRef.current = customNodeViewRootRef.current;
        customNodeViewRootRef.current.appendChild(dom);
        return ()=>{
            customNodeViewRef.current?.destroy?.();
        };
    }, []);
    useLayoutEffect(()=>{
        if (!customNodeView || !customNodeViewRef.current) return;
        const { destroy , update  } = customNodeViewRef.current;
        const updated = update?.call(customNodeViewRef.current, node, outerDeco, innerDeco) ?? true;
        if (updated) return;
        destroy?.call(customNodeViewRef.current);
        if (!customNodeView || !customNodeViewRootRef.current) return;
        initialNode.current = node;
        initialOuterDeco.current = outerDeco;
        initialInnerDeco.current = innerDeco;
        customNodeViewRef.current = customNodeView(initialNode.current, view, ()=>posRef.current, initialOuterDeco.current, initialInnerDeco.current);
        const { dom  } = customNodeViewRef.current;
        nodeDomRef.current = customNodeViewRootRef.current;
        customNodeViewRootRef.current.appendChild(dom);
    }, [
        customNodeView,
        view,
        innerDeco,
        node,
        outerDeco
    ]);
    const childDescriptors = useNodeViewDescriptor(node, domRef, nodeDomRef, innerDeco, outerDeco, undefined, contentDomRef);
    if (Component) {
        element = /*#__PURE__*/ React.createElement(Component, _extends({}, props, {
            ref: nodeDomRef,
            nodeProps: {
                node: node,
                pos: pos,
                decorations: outerDeco,
                innerDecorations: innerDeco,
                isSelected: state?.selection instanceof NodeSelection && state.selection.node === node
            }
        }), /*#__PURE__*/ React.createElement(ChildNodeViews, {
            pos: pos,
            node: node,
            innerDecorations: innerDeco
        }));
    } else if (customNodeView) {
        if (!customNodeViewRef.current) {
            customNodeViewRef.current = customNodeView(initialNode.current, view, ()=>posRef.current, initialOuterDeco.current, initialInnerDeco.current);
        }
        const { contentDOM  } = customNodeViewRef.current;
        contentDomRef.current = contentDOM ?? null;
        element = /*#__PURE__*/ createElement(node.isInline ? "span" : "div", {
            ref: customNodeViewRootRef,
            contentEditable: !!contentDOM,
            suppressContentEditableWarning: true
        }, contentDOM && /*#__PURE__*/ createPortal(/*#__PURE__*/ React.createElement(ChildNodeViews, {
            pos: pos,
            node: node,
            innerDecorations: innerDeco
        }), contentDOM));
    } else {
        const outputSpec = node.type.spec.toDOM?.(node);
        if (outputSpec) {
            element = /*#__PURE__*/ React.createElement(OutputSpec, _extends({}, props, {
                ref: nodeDomRef,
                outputSpec: outputSpec
            }), /*#__PURE__*/ React.createElement(ChildNodeViews, {
                pos: pos,
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
    // TODO: Should we only be wrapping non-inline elements? Inline elements have
    // already been wrapped in ChildNodeViews/InlineView?
    const markedElement = node.marks.reduce((element, mark)=>/*#__PURE__*/ React.createElement(MarkView, {
            mark: mark
        }, element), decoratedElement);
    return /*#__PURE__*/ React.createElement(ChildDescriptorsContext.Provider, {
        value: childDescriptors
    }, /*#__PURE__*/ cloneElement(markedElement, node.marks.length || // eslint-disable-next-line @typescript-eslint/no-explicit-any
    outerDeco.some((d)=>d.type.attrs.nodeName) ? {
        ref: domRef
    } : // we've already passed the domRef to the NodeView component
    // as a prop
    undefined));
}
