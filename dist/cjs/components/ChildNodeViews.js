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
    wrapInDeco: ()=>wrapInDeco,
    ChildNodeViews: ()=>ChildNodeViews
});
const _react = /*#__PURE__*/ _interopRequireWildcard(require("react"));
const _childDescriptorsContextJs = require("../contexts/ChildDescriptorsContext.js");
const _editorContextJs = require("../contexts/EditorContext.js");
const _iterDecoJs = require("../decorations/iterDeco.js");
const _useReactKeysJs = require("../hooks/useReactKeys.js");
const _propsJs = require("../props.js");
const _markViewJs = require("./MarkView.js");
const _nativeWidgetViewJs = require("./NativeWidgetView.js");
const _nodeViewJs = require("./NodeView.js");
const _separatorHackViewJs = require("./SeparatorHackView.js");
const _textNodeViewJs = require("./TextNodeView.js");
const _trailingHackViewJs = require("./TrailingHackView.js");
const _widgetViewJs = require("./WidgetView.js");
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
function wrapInDeco(reactNode, deco) {
    const { nodeName , ...attrs } = deco.type.attrs;
    const props = (0, _propsJs.htmlAttrsToReactProps)(attrs);
    // We auto-wrap text nodes in spans so that we can apply attributes
    // and styles, but we want to avoid double-wrapping the same
    // text node
    if (nodeName || typeof reactNode === "string") {
        return /*#__PURE__*/ (0, _react.createElement)(nodeName ?? "span", props, reactNode);
    }
    return /*#__PURE__*/ (0, _react.cloneElement)(reactNode, (0, _propsJs.mergeReactProps)(reactNode.props, props));
}
const ChildView = /*#__PURE__*/ (0, _react.memo)(function ChildView(param) {
    let { child , getInnerPos  } = param;
    const { view  } = (0, _react.useContext)(_editorContextJs.EditorContext);
    const getChildPos = (0, _react.useRef)(()=>getInnerPos.current() + child.offset);
    getChildPos.current = ()=>getInnerPos.current() + child.offset;
    const reactKeys = (0, _useReactKeysJs.useReactKeys)();
    const key = createKey(getInnerPos.current(), child, reactKeys?.posToKey);
    return child.type === "widget" ? /*#__PURE__*/ _react.default.createElement(_widgetViewJs.WidgetView, {
        key: key,
        widget: child.widget,
        getPos: getChildPos
    }) : child.type === "native-widget" ? /*#__PURE__*/ _react.default.createElement(_nativeWidgetViewJs.NativeWidgetView, {
        key: key,
        widget: child.widget,
        getPos: getChildPos
    }) : child.node.isText ? /*#__PURE__*/ _react.default.createElement(_childDescriptorsContextJs.ChildDescriptorsContext.Consumer, {
        key: key
    }, (param)=>/*#__PURE__*/ {
        let { siblingsRef , parentRef  } = param;
        return _react.default.createElement(_textNodeViewJs.TextNodeView, {
            view: view,
            node: child.node,
            getPos: getChildPos,
            siblingsRef: siblingsRef,
            parentRef: parentRef,
            decorations: child.outerDeco
        });
    }) : /*#__PURE__*/ _react.default.createElement(_nodeViewJs.NodeView, {
        key: key,
        node: child.node,
        getPos: getChildPos,
        outerDeco: child.outerDeco,
        innerDeco: child.innerDeco
    });
});
const InlinePartition = /*#__PURE__*/ (0, _react.memo)(function InlinePartition(param) {
    let { childViews , getInnerPos  } = param;
    const reactKeys = (0, _useReactKeysJs.useReactKeys)();
    const firstChild = childViews[0];
    const getFirstChildPos = (0, _react.useRef)(()=>getInnerPos.current() + firstChild.offset);
    getFirstChildPos.current = ()=>getInnerPos.current() + firstChild.offset;
    const firstMark = firstChild.marks[0];
    if (!firstMark) {
        return /*#__PURE__*/ _react.default.createElement(_react.default.Fragment, null, childViews.map((child)=>{
            const key = createKey(getInnerPos.current(), child, reactKeys?.posToKey);
            return /*#__PURE__*/ _react.default.createElement(ChildView, {
                key: key,
                child: child,
                getInnerPos: getInnerPos
            });
        }));
    }
    return /*#__PURE__*/ _react.default.createElement(_markViewJs.MarkView, {
        getPos: getFirstChildPos,
        key: createKey(// editorState?.doc,
        getInnerPos.current(), firstChild, reactKeys?.posToKey),
        mark: firstMark
    }, /*#__PURE__*/ _react.default.createElement(InlineView, {
        key: createKey(// editorState?.doc,
        getInnerPos.current(), firstChild, reactKeys?.posToKey),
        getInnerPos: getInnerPos,
        childViews: childViews.map((child)=>({
                ...child,
                marks: child.marks.slice(1)
            }))
    }));
});
const InlineView = /*#__PURE__*/ (0, _react.memo)(function InlineView(param) {
    let { getInnerPos , childViews  } = param;
    // const editorState = useEditorState();
    const reactKeys = (0, _useReactKeysJs.useReactKeys)();
    const partitioned = childViews.reduce((acc, child)=>{
        const lastPartition = acc[acc.length - 1];
        if (!lastPartition) {
            return [
                [
                    child
                ]
            ];
        }
        const lastChild = lastPartition[lastPartition.length - 1];
        if (!lastChild) {
            return [
                ...acc.slice(0, acc.length),
                [
                    child
                ]
            ];
        }
        if (!child.marks.length && !lastChild.marks.length || child.marks.length && lastChild.marks.length && // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        child.marks[0]?.eq(lastChild.marks[0])) {
            return [
                ...acc.slice(0, acc.length - 1),
                [
                    ...lastPartition.slice(0, lastPartition.length),
                    child
                ]
            ];
        }
        return [
            ...acc,
            [
                child
            ]
        ];
    }, []);
    return /*#__PURE__*/ _react.default.createElement(_react.default.Fragment, null, partitioned.map((childViews)=>{
        const firstChild = childViews[0];
        if (!firstChild) return null;
        const key = createKey(getInnerPos.current(), firstChild, reactKeys?.posToKey);
        return /*#__PURE__*/ _react.default.createElement(InlinePartition, {
            key: key,
            childViews: childViews,
            getInnerPos: getInnerPos
        });
    }));
});
function createKey(// doc: Node | undefined,
innerPos, child, posToKey) {
    const pos = innerPos + child.offset;
    const key = posToKey?.get(pos);
    if (child.type === "widget" || child.type === "native-widget") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (child.widget.type.spec.key) // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return child.widget.type.spec.key;
        // eslint-disable-next-line no-console
        console.warn(`Widget at position ${pos} doesn't have a key specified. This has negative performance implications.`);
        return `${key}-${child.index}`;
    }
    if (key) return key;
    // if (!doc) return pos;
    // const parentPos = doc.resolve(pos).start() - 1;
    // const parentKey = posToKey?.get(parentPos);
    // if (parentKey) return `${parentKey}-${child.offset}`;
    return pos;
}
function adjustWidgetMarksForward(children) {
    const lastChild = children[children.length - 1];
    if (lastChild?.type !== "widget" && lastChild?.type !== "native-widget" || // Using internal Decoration property, "type"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lastChild.widget.type.side >= 0) return;
    let lastNodeChild = null;
    for(let i = children.length - 2; i >= 0; i--){
        const child = children[i];
        if (child?.type === "node") {
            lastNodeChild = child;
            break;
        }
    }
    if (!lastNodeChild || !lastNodeChild.node.isInline) return;
    const marksToSpread = lastNodeChild.marks;
    lastChild.marks = lastChild.marks.reduce((acc, mark)=>mark.addToSet(acc), marksToSpread);
}
function adjustWidgetMarksBack(children) {
    const lastChild = children[children.length - 1];
    if (lastChild?.type !== "node" || !lastChild.node.isInline) return;
    const marksToSpread = lastChild.marks;
    for(let i = children.length - 2; i >= 0; i--){
        const child = children[i];
        if (child?.type !== "widget" && child?.type !== "native-widget" || // Using internal Decoration property, "type"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        child.widget.type.side < 0) break;
        child.marks = child.marks.reduce((acc, mark)=>mark.addToSet(acc), marksToSpread);
    }
}
const ChildElement = /*#__PURE__*/ (0, _react.memo)(function ChildElement(param) {
    let { child , getInnerPos , posToKey  } = param;
    const getNodePos = (0, _react.useRef)(()=>getInnerPos.current() + child.offset);
    getNodePos.current = ()=>getInnerPos.current() + child.offset;
    const key = createKey(getInnerPos.current(), child, posToKey);
    if (child.type === "node") {
        return /*#__PURE__*/ _react.default.createElement(_nodeViewJs.NodeView, {
            key: key,
            outerDeco: child.outerDeco,
            node: child.node,
            innerDeco: child.innerDeco,
            getPos: getNodePos
        });
    } else {
        return /*#__PURE__*/ _react.default.createElement(InlineView, {
            key: key,
            childViews: [
                child
            ],
            getInnerPos: getInnerPos
        });
    }
}, /**
   * It's safe to skip re-rendering a ChildElement component as long
   * as its child prop is shallowly equivalent to the previous render.
   * posToKey will be updated on every doc update, but if the child
   * hasn't changed, it will still have the same key.
   */ (prevProps, nextProps)=>prevProps.child.type === nextProps.child.type && prevProps.child.marks.every((mark)=>mark.isInSet(nextProps.child.marks)) && nextProps.child.marks.every((mark)=>mark.isInSet(prevProps.child.marks)) && prevProps.child.offset === nextProps.child.offset && // @ts-expect-error It's fine if these are undefined
    prevProps.child.node === nextProps.child.node && // @ts-expect-error It's fine if these are undefined
    prevProps.child.widget === nextProps.child.widget);
function createChildElements(children, getInnerPos, // doc: Node | undefined,
posToKey) {
    if (!children.length) return [];
    if (children.every((child)=>child.type !== "node" || child.node.isInline)) {
        return [
            /*#__PURE__*/ _react.default.createElement(InlineView, {
                key: createKey(// doc,
                getInnerPos.current(), // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                children[0], posToKey),
                childViews: children,
                getInnerPos: getInnerPos
            })
        ];
    }
    return children.map((child)=>{
        const key = createKey(getInnerPos.current(), child, posToKey);
        return /*#__PURE__*/ _react.default.createElement(ChildElement, {
            key: key,
            child: child,
            posToKey: posToKey,
            getInnerPos: getInnerPos
        });
    });
}
const ChildNodeViews = /*#__PURE__*/ (0, _react.memo)(function ChildNodeViews(param) {
    let { getPos , node , innerDecorations  } = param;
    // const editorState = useEditorState();
    const reactKeys = (0, _useReactKeysJs.useReactKeys)();
    const getInnerPos = (0, _react.useRef)(()=>getPos.current() + 1);
    if (!node) return null;
    const children = [];
    (0, _iterDecoJs.iterDeco)(node, innerDecorations, (widget, isNative, offset, index)=>{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const widgetMarks = widget.type.spec.marks ?? [];
        if (isNative) {
            children.push({
                type: "native-widget",
                widget: widget,
                marks: widgetMarks,
                offset,
                index
            });
        } else {
            children.push({
                type: "widget",
                widget: widget,
                marks: widgetMarks,
                offset,
                index
            });
        }
        adjustWidgetMarksForward(children);
    }, (childNode, outerDeco, innerDeco, offset)=>{
        children.push({
            type: "node",
            node: childNode,
            marks: childNode.marks,
            innerDeco,
            outerDeco,
            offset
        });
        adjustWidgetMarksBack(children);
    });
    const childElements = createChildElements(children, getInnerPos, // editorState.doc,
    reactKeys?.posToKey);
    const lastChild = children[children.length - 1];
    if (!lastChild || lastChild.type !== "node" || lastChild.node.isInline && !lastChild.node.isText || // RegExp.test actually handles undefined just fine
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    /\n$/.test(lastChild.node.text)) {
        childElements.push(/*#__PURE__*/ _react.default.createElement(_separatorHackViewJs.SeparatorHackView, {
            getPos: getInnerPos,
            key: "trailing-hack-img"
        }), /*#__PURE__*/ _react.default.createElement(_trailingHackViewJs.TrailingHackView, {
            getPos: getInnerPos,
            key: "trailing-hack-br"
        }));
    }
    return /*#__PURE__*/ _react.default.createElement(_react.default.Fragment, null, childElements);
});
