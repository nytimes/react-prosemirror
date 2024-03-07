import React, { forwardRef, useContext, useImperativeHandle, useState } from "react";
import { createPortal } from "react-dom";
import { PortalRegistryContext } from "../contexts/PortalRegistryContext.js";
import { useEditorEffect } from "../hooks/useEditorEffect.js";
import { NodePosProvider } from "../hooks/useNodePos.js";
import { ROOT_NODE_KEY, createNodeKey, reactPluginKey } from "../plugins/react.js";
import { phrasingContentTags } from "./phrasingContentTags.js";
/**
 * Identifies a node view constructor as having been created
 * by @nytimes/react-prosemirror
 */ export const REACT_NODE_VIEW = Symbol("react node view");
/**
 * Searches upward for the nearest node with a node key,
 * returning the first node key it finds associated with
 * a React node view.
 *
 * Returns the root key if no ancestor nodes have node keys.
 */ export function findNodeKeyUp(editorView, pos) {
    const pluginState = reactPluginKey.getState(editorView.state);
    if (!pluginState) return ROOT_NODE_KEY;
    const $pos = editorView.state.doc.resolve(pos);
    for(let d = $pos.depth; d > 0; d--){
        const ancestorNodeTypeName = $pos.node(d).type.name;
        const ancestorNodeView = editorView.props.nodeViews?.[ancestorNodeTypeName];
        if (!ancestorNodeView?.[REACT_NODE_VIEW]) continue;
        const ancestorPos = $pos.before(d);
        const ancestorKey = pluginState.posToKey.get(ancestorPos);
        if (ancestorKey) return ancestorKey;
    }
    return ROOT_NODE_KEY;
}
/**
 * Factory function for creating nodeViewConstructors that
 * render as React components.
 *
 * `ReactComponent` can be any React component that takes
 * `NodeViewComponentProps`. It will be passed all of the
 * arguments to the `nodeViewConstructor` except for
 * `editorView`. NodeView components that need access
 * directly to the EditorView should use the
 * `useEditorViewEvent` and `useEditorViewLayoutEffect`
 * hooks to ensure safe access.
 *
 * For contentful Nodes, the NodeView component will also
 * be passed a `children` prop containing an empty element.
 * ProseMirror will render content nodes into this element.
 */ export function createReactNodeViewConstructor(reactNodeViewConstructor, registerPortal) {
    function nodeViewConstructor(node, editorView, getPos, decorations, innerDecorations) {
        const reactNodeView = reactNodeViewConstructor(node, editorView, getPos, decorations, innerDecorations);
        let componentRef = null;
        const { dom , contentDOM , component: ReactComponent  } = reactNodeView;
        // Use a span if the provided contentDOM is in the "phrasing" content
        // category. Otherwise use a div. This is our best attempt at not
        // breaking the intended content model, for now.
        //
        // https://developer.mozilla.org/en-US/docs/Web/HTML/Content_categories#phrasing_content
        const ContentDOMWrapper = contentDOM && (phrasingContentTags.includes(contentDOM.tagName.toLocaleLowerCase()) ? "span" : "div");
        const reactPluginState = reactPluginKey.getState(editorView.state);
        if (!reactPluginState) throw new Error("Can't find the react() ProseMirror plugin, required for useNodeViews(). Was it added to the EditorState.plugins?");
        const nodeKey = reactPluginState.posToKey.get(getPos()) ?? createNodeKey();
        /**
     * Wrapper component to provide some imperative handles for updating
     * and re-rendering its child. Takes and renders an arbitrary ElementType
     * that expects NodeViewComponentProps as props.
     */ const NodeViewWrapper = /*#__PURE__*/ forwardRef(function NodeViewWrapper(param, ref) {
            let { initialState  } = param;
            const [node, setNode] = useState(initialState.node);
            const [decorations, setDecorations] = useState(initialState.decorations);
            const [isSelected, setIsSelected] = useState(initialState.isSelected);
            const portalRegistry = useContext(PortalRegistryContext);
            const childRegisteredPortals = portalRegistry[nodeKey];
            const [childPortals, setChildPortals] = useState(childRegisteredPortals?.map((param)=>{
                let { portal  } = param;
                return portal;
            }));
            // `getPos` is technically derived from the EditorView
            // state, so it's not safe to call until after the EditorView
            // has been updated
            useEditorEffect(()=>{
                setChildPortals(childRegisteredPortals?.sort((a, b)=>a.getPos() - b.getPos()).map((param)=>{
                    let { portal  } = param;
                    return portal;
                }));
            }, [
                childRegisteredPortals
            ]);
            const [contentDOMWrapper, setContentDOMWrapper] = useState(null);
            const [contentDOMParent, setContentDOMParent] = useState(null);
            useImperativeHandle(ref, ()=>({
                    node,
                    contentDOMWrapper: contentDOMWrapper,
                    contentDOMParent: contentDOMParent,
                    setNode,
                    setDecorations,
                    setIsSelected
                }), [
                node,
                contentDOMWrapper,
                contentDOMParent
            ]);
            return /*#__PURE__*/ React.createElement(NodePosProvider, {
                nodeKey: nodeKey
            }, /*#__PURE__*/ React.createElement(ReactComponent, {
                node: node,
                decorations: decorations,
                isSelected: isSelected
            }, childPortals, ContentDOMWrapper && /*#__PURE__*/ React.createElement(ContentDOMWrapper, {
                style: {
                    display: "contents"
                },
                ref: (nextContentDOMWrapper)=>{
                    setContentDOMWrapper(nextContentDOMWrapper);
                    // we preserve a reference to the contentDOMWrapper'
                    // parent so that later we can reassemble the DOM hierarchy
                    // React expects when cleaning up the ContentDOMWrapper element
                    if (nextContentDOMWrapper?.parentNode) {
                        setContentDOMParent(nextContentDOMWrapper.parentNode);
                    }
                }
            })));
        });
        NodeViewWrapper.displayName = `NodeView(${ReactComponent.displayName ?? ReactComponent.name})`;
        const element = /*#__PURE__*/ React.createElement(NodeViewWrapper, {
            initialState: {
                node,
                decorations,
                isSelected: false
            },
            ref: (c)=>{
                componentRef = c;
                if (!componentRef || componentRef.node.isLeaf) return;
                const contentDOMWrapper = componentRef.contentDOMWrapper;
                if (!contentDOMWrapper || !(contentDOMWrapper instanceof HTMLElement)) {
                    return;
                }
                // We always set contentDOM when !node.isLeaf, which is checked above
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                contentDOMWrapper.appendChild(contentDOM);
                // Synchronize the ProseMirror selection to the DOM, because mounting the
                // component changes the DOM outside of a ProseMirror update.
                const { node  } = componentRef;
                const pos = getPos();
                const end = pos + node.nodeSize;
                const { from , to  } = editorView.state.selection;
                if (editorView.hasFocus() && pos < from && to < end) {
                    // This call seems like it should be a no-op, given the editor already has
                    // focus, but it causes ProseMirror to synchronize the DOM selection with
                    // its state again, placing the DOM selection in a reasonable place within
                    // the node.
                    editorView.focus();
                }
            }
        });
        const portal = /*#__PURE__*/ createPortal(element, dom, nodeKey);
        const unregisterPortal = registerPortal(editorView, getPos, portal);
        return {
            ignoreMutation (record) {
                return !contentDOM?.contains(record.target);
            },
            ...reactNodeView,
            selectNode () {
                componentRef?.setIsSelected(true);
                reactNodeView.selectNode?.();
            },
            deselectNode () {
                componentRef?.setIsSelected(false);
                reactNodeView.deselectNode?.();
            },
            update (node, decorations, innerDecorations) {
                // If this node view's parent has been removed from the registry, we
                // need to rebuild it and its children with new registry keys
                const positionRegistry = reactPluginKey.getState(editorView.state);
                if (positionRegistry && nodeKey !== positionRegistry.posToKey.get(getPos())) {
                    return false;
                }
                if (reactNodeView.update?.(node, decorations, innerDecorations) === false) {
                    return false;
                }
                if (node.type === componentRef?.node.type) {
                    componentRef?.setNode(node);
                    componentRef?.setDecorations(decorations);
                    return true;
                }
                return false;
            },
            destroy () {
                // React expects the contentDOMParent to be a child of the
                // DOM element where the portal was mounted, but in some situations
                // contenteditable may have already detached the contentDOMParent
                // from the DOM. Here we attempt to reassemble the DOM that React
                // expects when cleaning up the portal.
                if (componentRef?.contentDOMParent) {
                    this.dom.appendChild(componentRef.contentDOMParent);
                }
                unregisterPortal();
                reactNodeView.destroy?.();
            }
        };
    }
    return Object.assign(nodeViewConstructor, {
        [REACT_NODE_VIEW]: true
    });
}
