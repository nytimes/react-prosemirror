"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    REACT_NODE_VIEW: ()=>REACT_NODE_VIEW,
    findNodeKeyUp: ()=>findNodeKeyUp,
    createReactNodeViewConstructor: ()=>createReactNodeViewConstructor
});
const _react = /*#__PURE__*/ _interopRequireWildcard(require("react"));
const _reactDom = require("react-dom");
const _portalRegistryContextJs = require("../contexts/PortalRegistryContext.js");
const _useEditorEffectJs = require("../hooks/useEditorEffect.js");
const _useNodePosJs = require("../hooks/useNodePos.js");
const _reactJs = require("../plugins/react.js");
const _phrasingContentTagsJs = require("./phrasingContentTags.js");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interopRequireWildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {};
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
const REACT_NODE_VIEW = Symbol("react node view");
function findNodeKeyUp(editorView, pos) {
    const pluginState = _reactJs.reactPluginKey.getState(editorView.state);
    if (!pluginState) return _reactJs.ROOT_NODE_KEY;
    const $pos = editorView.state.doc.resolve(pos);
    for(let d = $pos.depth; d > 0; d--){
        const ancestorNodeTypeName = $pos.node(d).type.name;
        const ancestorNodeView = editorView.props.nodeViews?.[ancestorNodeTypeName];
        if (!ancestorNodeView?.[REACT_NODE_VIEW]) continue;
        const ancestorPos = $pos.before(d);
        const ancestorKey = pluginState.posToKey.get(ancestorPos);
        if (ancestorKey) return ancestorKey;
    }
    return _reactJs.ROOT_NODE_KEY;
}
function createReactNodeViewConstructor(reactNodeViewConstructor, registerPortal) {
    function nodeViewConstructor(node, editorView, getPos, decorations, innerDecorations) {
        const reactNodeView = reactNodeViewConstructor(node, editorView, getPos, decorations, innerDecorations);
        let componentRef = null;
        const { dom , contentDOM , component: ReactComponent  } = reactNodeView;
        // Use a span if the provided contentDOM is in the "phrasing" content
        // category. Otherwise use a div. This is our best attempt at not
        // breaking the intended content model, for now.
        //
        // https://developer.mozilla.org/en-US/docs/Web/HTML/Content_categories#phrasing_content
        const ContentDOMWrapper = contentDOM && (_phrasingContentTagsJs.phrasingContentTags.includes(contentDOM.tagName.toLocaleLowerCase()) ? "span" : "div");
        const reactPluginState = _reactJs.reactPluginKey.getState(editorView.state);
        if (!reactPluginState) throw new Error("Can't find the react() ProseMirror plugin, required for useNodeViews(). Was it added to the EditorState.plugins?");
        const nodeKey = reactPluginState.posToKey.get(getPos()) ?? (0, _reactJs.createNodeKey)();
        /**
     * Wrapper component to provide some imperative handles for updating
     * and re-rendering its child. Takes and renders an arbitrary ElementType
     * that expects NodeViewComponentProps as props.
     */ const NodeViewWrapper = /*#__PURE__*/ (0, _react.forwardRef)(function NodeViewWrapper(param, ref) {
            let { initialState  } = param;
            const [node, setNode] = (0, _react.useState)(initialState.node);
            const [decorations, setDecorations] = (0, _react.useState)(initialState.decorations);
            const [isSelected, setIsSelected] = (0, _react.useState)(initialState.isSelected);
            const portalRegistry = (0, _react.useContext)(_portalRegistryContextJs.PortalRegistryContext);
            const childRegisteredPortals = portalRegistry[nodeKey];
            const [childPortals, setChildPortals] = (0, _react.useState)(childRegisteredPortals?.map((param)=>{
                let { portal  } = param;
                return portal;
            }));
            // `getPos` is technically derived from the EditorView
            // state, so it's not safe to call until after the EditorView
            // has been updated
            (0, _useEditorEffectJs.useEditorEffect)(()=>{
                setChildPortals(childRegisteredPortals?.sort((a, b)=>a.getPos() - b.getPos()).map((param)=>{
                    let { portal  } = param;
                    return portal;
                }));
            }, [
                childRegisteredPortals
            ]);
            const [contentDOMWrapper, setContentDOMWrapper] = (0, _react.useState)(null);
            const [contentDOMParent, setContentDOMParent] = (0, _react.useState)(null);
            (0, _react.useImperativeHandle)(ref, ()=>({
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
            return /*#__PURE__*/ _react.default.createElement(_useNodePosJs.NodePosProvider, {
                nodeKey: nodeKey
            }, /*#__PURE__*/ _react.default.createElement(ReactComponent, {
                node: node,
                decorations: decorations,
                isSelected: isSelected
            }, childPortals, ContentDOMWrapper && /*#__PURE__*/ _react.default.createElement(ContentDOMWrapper, {
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
        const element = /*#__PURE__*/ _react.default.createElement(NodeViewWrapper, {
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
        const portal = /*#__PURE__*/ (0, _reactDom.createPortal)(element, dom, nodeKey);
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
                const positionRegistry = _reactJs.reactPluginKey.getState(editorView.state);
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
