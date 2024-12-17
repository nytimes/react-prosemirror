"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "NodeView", {
    enumerable: true,
    get: function() {
        return NodeView;
    }
});
const _react = /*#__PURE__*/ _interop_require_wildcard(require("react"));
const _ChildDescriptorsContext = require("../contexts/ChildDescriptorsContext.js");
const _EditorContext = require("../contexts/EditorContext.js");
const _NodeViewContext = require("../contexts/NodeViewContext.js");
const _SelectNodeContext = require("../contexts/SelectNodeContext.js");
const _StopEventContext = require("../contexts/StopEventContext.js");
const _useNodeViewDescriptor = require("../hooks/useNodeViewDescriptor.js");
const _ChildNodeViews = require("./ChildNodeViews.js");
const _CustomNodeView = require("./CustomNodeView.js");
const _MarkView = require("./MarkView.js");
const _OutputSpec = require("./OutputSpec.js");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
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
    var newObj = {
        __proto__: null
    };
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
const NodeView = /*#__PURE__*/ (0, _react.memo)(function NodeView(param) {
    let { outerDeco, getPos, node, innerDeco, ...props } = param;
    const domRef = (0, _react.useRef)(null);
    const nodeDomRef = (0, _react.useRef)(null);
    const contentDomRef = (0, _react.useRef)(null);
    const getPosFunc = (0, _react.useRef)(()=>getPos.current()).current;
    // this is ill-conceived; should revisit
    const initialNode = (0, _react.useRef)(node);
    const initialOuterDeco = (0, _react.useRef)(outerDeco);
    const initialInnerDeco = (0, _react.useRef)(innerDeco);
    const customNodeViewRootRef = (0, _react.useRef)(null);
    const customNodeViewRef = (0, _react.useRef)(null);
    // const state = useEditorState();
    const { nodeViews } = (0, _react.useContext)(_NodeViewContext.NodeViewContext);
    const { view } = (0, _react.useContext)(_EditorContext.EditorContext);
    let element = null;
    const Component = nodeViews[node.type.name];
    const outputSpec = (0, _react.useMemo)(()=>node.type.spec.toDOM?.(node), [
        node
    ]);
    // TODO: Would be great to pull all of the custom node view stuff into
    // a hook
    const customNodeView = view?.someProp("nodeViews", (nodeViews)=>nodeViews?.[node.type.name]);
    (0, _react.useLayoutEffect)(()=>{
        if (!customNodeViewRef.current || !customNodeViewRootRef.current) return;
        const { dom } = customNodeViewRef.current;
        nodeDomRef.current = customNodeViewRootRef.current;
        customNodeViewRootRef.current.appendChild(dom);
        return ()=>{
            customNodeViewRef.current?.destroy?.();
        };
    }, []);
    (0, _react.useLayoutEffect)(()=>{
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
    const { hasContentDOM, childDescriptors, setStopEvent, setSelectNode, nodeViewDescRef } = (0, _useNodeViewDescriptor.useNodeViewDescriptor)(node, ()=>getPos.current(), domRef, nodeDomRef, innerDeco, outerDeco, undefined, contentDomRef);
    const finalProps = {
        ...props,
        ...!hasContentDOM && {
            contentEditable: false
        }
    };
    const nodeProps = (0, _react.useMemo)(()=>({
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
        element = /*#__PURE__*/ _react.default.createElement(Component, {
            ...finalProps,
            ref: nodeDomRef,
            nodeProps: nodeProps
        }, /*#__PURE__*/ _react.default.createElement(_ChildNodeViews.ChildNodeViews, {
            getPos: getPos,
            node: node,
            innerDecorations: innerDeco
        }));
    } else if (customNodeView) {
        element = /*#__PURE__*/ _react.default.createElement(_CustomNodeView.CustomNodeView, {
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
            element = /*#__PURE__*/ _react.default.createElement(_OutputSpec.OutputSpec, {
                ...finalProps,
                ref: nodeDomRef,
                outputSpec: outputSpec
            }, /*#__PURE__*/ _react.default.createElement(_ChildNodeViews.ChildNodeViews, {
                getPos: getPos,
                node: node,
                innerDecorations: innerDeco
            }));
        }
    }
    if (!element) {
        throw new Error(`Node spec for ${node.type.name} is missing toDOM`);
    }
    const decoratedElement = /*#__PURE__*/ (0, _react.cloneElement)(outerDeco.reduce(_ChildNodeViews.wrapInDeco, element), // eslint-disable-next-line @typescript-eslint/no-explicit-any
    outerDeco.some((d)=>d.type.attrs.nodeName) ? {
        ref: domRef
    } : // we've already passed the domRef to the NodeView component
    // as a prop
    undefined);
    // Inline nodes will already be wrapped in marks
    // via the ChildNodeViews component
    const markedElement = node.isInline ? decoratedElement : node.marks.reduce((element, mark)=>/*#__PURE__*/ _react.default.createElement(_MarkView.MarkView, {
            getPos: getPos,
            mark: mark
        }, element), decoratedElement);
    const childContextValue = (0, _react.useMemo)(()=>({
            parentRef: nodeViewDescRef,
            siblingsRef: childDescriptors
        }), [
        childDescriptors,
        nodeViewDescRef
    ]);
    return /*#__PURE__*/ _react.default.createElement(_SelectNodeContext.SelectNodeContext.Provider, {
        value: setSelectNode
    }, /*#__PURE__*/ _react.default.createElement(_StopEventContext.StopEventContext.Provider, {
        value: setStopEvent
    }, /*#__PURE__*/ _react.default.createElement(_ChildDescriptorsContext.ChildDescriptorsContext.Provider, {
        value: childContextValue
    }, /*#__PURE__*/ (0, _react.cloneElement)(markedElement, node.marks.length && !node.isInline || // eslint-disable-next-line @typescript-eslint/no-explicit-any
    outerDeco.some((d)=>d.type.attrs.nodeName) ? {
        ref: domRef
    } : // we've already passed the domRef to the NodeView component
    // as a prop
    undefined))));
});
