"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "NodeView", {
    enumerable: true,
    get: ()=>NodeView
});
const _prosemirrorState = require("prosemirror-state");
const _react = /*#__PURE__*/ _interopRequireWildcard(require("react"));
const _reactDom = require("react-dom");
const _childDescriptorsContextJs = require("../contexts/ChildDescriptorsContext.js");
const _editorContextJs = require("../contexts/EditorContext.js");
const _nodeViewContextJs = require("../contexts/NodeViewContext.js");
const _useEditorStateJs = require("../hooks/useEditorState.js");
const _useNodeViewDescriptorJs = require("../hooks/useNodeViewDescriptor.js");
const _childNodeViewsJs = require("./ChildNodeViews.js");
const _markViewJs = require("./MarkView.js");
const _outputSpecJs = require("./OutputSpec.js");
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
function NodeView(param) {
    let { outerDeco , pos , node , innerDeco , ...props } = param;
    const domRef = (0, _react.useRef)(null);
    const nodeDomRef = (0, _react.useRef)(null);
    const contentDomRef = (0, _react.useRef)(null);
    // this is ill-conceived; should revisit
    const initialNode = (0, _react.useRef)(node);
    const initialOuterDeco = (0, _react.useRef)(outerDeco);
    const initialInnerDeco = (0, _react.useRef)(innerDeco);
    const posRef = (0, _react.useRef)(pos);
    posRef.current = pos;
    const customNodeViewRootRef = (0, _react.useRef)(null);
    const customNodeViewRef = (0, _react.useRef)(null);
    const state = (0, _useEditorStateJs.useEditorState)();
    const { nodeViews  } = (0, _react.useContext)(_nodeViewContextJs.NodeViewContext);
    const { view  } = (0, _react.useContext)(_editorContextJs.EditorContext);
    let element = null;
    const Component = nodeViews[node.type.name];
    // TODO: Would be great to pull all of the custom node view stuff into
    // a hook
    const customNodeView = view?.someProp("nodeViews")?.[node.type.name];
    (0, _react.useLayoutEffect)(()=>{
        if (!customNodeViewRef.current || !customNodeViewRootRef.current) return;
        const { dom  } = customNodeViewRef.current;
        nodeDomRef.current = customNodeViewRootRef.current;
        customNodeViewRootRef.current.appendChild(dom);
        return ()=>{
            customNodeViewRef.current?.destroy?.();
        };
    }, []);
    (0, _react.useLayoutEffect)(()=>{
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
    const childDescriptors = (0, _useNodeViewDescriptorJs.useNodeViewDescriptor)(node, domRef, nodeDomRef, innerDeco, outerDeco, undefined, contentDomRef);
    if (Component) {
        element = /*#__PURE__*/ _react.default.createElement(Component, _extends({}, props, {
            ref: nodeDomRef,
            nodeProps: {
                node: node,
                pos: pos,
                decorations: outerDeco,
                innerDecorations: innerDeco,
                isSelected: state?.selection instanceof _prosemirrorState.NodeSelection && state.selection.node === node
            }
        }), /*#__PURE__*/ _react.default.createElement(_childNodeViewsJs.ChildNodeViews, {
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
        element = /*#__PURE__*/ (0, _react.createElement)(node.isInline ? "span" : "div", {
            ref: customNodeViewRootRef,
            contentEditable: !!contentDOM,
            suppressContentEditableWarning: true
        }, contentDOM && /*#__PURE__*/ (0, _reactDom.createPortal)(/*#__PURE__*/ _react.default.createElement(_childNodeViewsJs.ChildNodeViews, {
            pos: pos,
            node: node,
            innerDecorations: innerDeco
        }), contentDOM));
    } else {
        const outputSpec = node.type.spec.toDOM?.(node);
        if (outputSpec) {
            element = /*#__PURE__*/ _react.default.createElement(_outputSpecJs.OutputSpec, _extends({}, props, {
                ref: nodeDomRef,
                outputSpec: outputSpec
            }), /*#__PURE__*/ _react.default.createElement(_childNodeViewsJs.ChildNodeViews, {
                pos: pos,
                node: node,
                innerDecorations: innerDeco
            }));
        }
    }
    if (!element) {
        throw new Error(`Node spec for ${node.type.name} is missing toDOM`);
    }
    const decoratedElement = /*#__PURE__*/ (0, _react.cloneElement)(outerDeco.reduce(_childNodeViewsJs.wrapInDeco, element), // eslint-disable-next-line @typescript-eslint/no-explicit-any
    outerDeco.some((d)=>d.type.attrs.nodeName) ? {
        ref: domRef
    } : // we've already passed the domRef to the NodeView component
    // as a prop
    undefined);
    // TODO: Should we only be wrapping non-inline elements? Inline elements have
    // already been wrapped in ChildNodeViews/InlineView?
    const markedElement = node.marks.reduce((element, mark)=>/*#__PURE__*/ _react.default.createElement(_markViewJs.MarkView, {
            mark: mark
        }, element), decoratedElement);
    return /*#__PURE__*/ _react.default.createElement(_childDescriptorsContextJs.ChildDescriptorsContext.Provider, {
        value: childDescriptors
    }, /*#__PURE__*/ (0, _react.cloneElement)(markedElement, node.marks.length || // eslint-disable-next-line @typescript-eslint/no-explicit-any
    outerDeco.some((d)=>d.type.attrs.nodeName) ? {
        ref: domRef
    } : // we've already passed the domRef to the NodeView component
    // as a prop
    undefined));
}
