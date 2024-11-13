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
function areChildrenEqual(a, b) {
    return a.type === b.type && a.marks.every((mark)=>mark.isInSet(b.marks)) && b.marks.every((mark)=>mark.isInSet(a.marks)) && a.key === b.key && (a.type === "node" ? a.outerDeco?.length === b.outerDeco?.length && a.outerDeco?.every((prevDeco)=>b.outerDeco?.some((nextDeco)=>prevDeco.from === nextDeco.from && prevDeco.to && nextDeco.to && prevDeco.type.eq(nextDeco.type))) && a.innerDeco.eq(b.innerDeco) : true) && a.node === b.node && a.widget === b.widget;
}
const ChildView = /*#__PURE__*/ (0, _react.memo)(function ChildView(param) {
    let { child , getInnerPos  } = param;
    const { view  } = (0, _react.useContext)(_editorContextJs.EditorContext);
    const getChildPos = (0, _react.useRef)(()=>getInnerPos.current() + child.offset);
    getChildPos.current = ()=>getInnerPos.current() + child.offset;
    return child.type === "widget" ? /*#__PURE__*/ _react.default.createElement(_widgetViewJs.WidgetView, {
        key: child.key,
        widget: child.widget,
        getPos: getChildPos
    }) : child.type === "native-widget" ? /*#__PURE__*/ _react.default.createElement(_nativeWidgetViewJs.NativeWidgetView, {
        key: child.key,
        widget: child.widget,
        getPos: getChildPos
    }) : child.node.isText ? /*#__PURE__*/ _react.default.createElement(_childDescriptorsContextJs.ChildDescriptorsContext.Consumer, {
        key: child.key
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
        key: child.key,
        node: child.node,
        getPos: getChildPos,
        outerDeco: child.outerDeco,
        innerDeco: child.innerDeco
    });
});
const InlinePartition = /*#__PURE__*/ (0, _react.memo)(function InlinePartition(param) {
    let { childViews , getInnerPos  } = param;
    const firstChild = childViews[0];
    const getFirstChildPos = (0, _react.useRef)(()=>getInnerPos.current() + firstChild.offset);
    getFirstChildPos.current = ()=>getInnerPos.current() + firstChild.offset;
    const firstMark = firstChild.marks[0];
    if (!firstMark) {
        return /*#__PURE__*/ _react.default.createElement(_react.default.Fragment, null, childViews.map((child)=>{
            return /*#__PURE__*/ _react.default.createElement(ChildView, {
                key: child.key,
                child: child,
                getInnerPos: getInnerPos
            });
        }));
    }
    return /*#__PURE__*/ _react.default.createElement(_markViewJs.MarkView, {
        getPos: getFirstChildPos,
        key: firstChild.key,
        mark: firstMark
    }, /*#__PURE__*/ _react.default.createElement(InlineView, {
        key: firstChild.key,
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
        return /*#__PURE__*/ _react.default.createElement(InlinePartition, {
            key: firstChild.key,
            childViews: childViews,
            getInnerPos: getInnerPos
        });
    }));
});
function createKey(innerPos, offset, type, posToKey, widget, index) {
    const pos = innerPos + offset;
    const key = posToKey?.get(pos);
    if (type === "widget" || type === "native-widget") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (widget.type.spec.key) // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return widget.type.spec.key;
        // eslint-disable-next-line no-console
        console.warn(`Widget at position ${pos} doesn't have a key specified. This may cause issues.`);
        return `${key}-${index}`;
    }
    if (key) return key;
    // if (!doc) return pos;
    const parentPos = innerPos - 1;
    const parentKey = posToKey?.get(parentPos);
    if (parentKey) return `${parentKey}-${offset}`;
    return pos;
}
function adjustWidgetMarksForward(lastNodeChild, widgetChild) {
    if (!widgetChild || // Using internal Decoration property, "type"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    widgetChild.widget.type.side >= 0) return;
    if (!lastNodeChild || !lastNodeChild.node.isInline) return;
    const marksToSpread = lastNodeChild.marks;
    widgetChild.marks = widgetChild.marks.reduce((acc, mark)=>mark.addToSet(acc), marksToSpread);
}
function adjustWidgetMarksBack(widgetChildren, nodeChild) {
    if (!nodeChild.node.isInline) return;
    const marksToSpread = nodeChild.marks;
    for(let i = widgetChildren.length - 1; i >= 0; i--){
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const child = widgetChildren[i];
        if (// Using internal Decoration property, "type"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        child.widget.type.side < 0) {
            continue;
        }
        child.marks = child.marks.reduce((acc, mark)=>mark.addToSet(acc), marksToSpread);
    }
}
const ChildElement = /*#__PURE__*/ (0, _react.memo)(function ChildElement(param) {
    let { child , getInnerPos  } = param;
    const getNodePos = (0, _react.useRef)(()=>getInnerPos.current() + child.offset);
    getNodePos.current = ()=>getInnerPos.current() + child.offset;
    if (child.type === "node") {
        return /*#__PURE__*/ _react.default.createElement(_nodeViewJs.NodeView, {
            key: child.key,
            outerDeco: child.outerDeco,
            node: child.node,
            innerDeco: child.innerDeco,
            getPos: getNodePos
        });
    } else {
        return /*#__PURE__*/ _react.default.createElement(InlineView, {
            key: child.key,
            childViews: [
                child
            ],
            getInnerPos: getInnerPos
        });
    }
});
function createChildElements(children, getInnerPos) {
    if (!children.length) return [];
    if (children.every((child)=>child.type !== "node" || child.node.isInline)) {
        return [
            /*#__PURE__*/ _react.default.createElement(InlineView, {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                key: children[0].key,
                childViews: children,
                getInnerPos: getInnerPos
            })
        ];
    }
    return children.map((child)=>{
        return /*#__PURE__*/ _react.default.createElement(ChildElement, {
            key: child.key,
            child: child,
            getInnerPos: getInnerPos
        });
    });
}
const ChildNodeViews = /*#__PURE__*/ (0, _react.memo)(function ChildNodeViews(param) {
    let { getPos , node , innerDecorations  } = param;
    // const editorState = useEditorState();
    const reactKeys = (0, _useReactKeysJs.useReactKeys)();
    const getInnerPos = (0, _react.useRef)(()=>getPos.current() + 1);
    const childMap = (0, _react.useRef)(new Map()).current;
    if (!node) return null;
    const keysSeen = new Set();
    let widgetChildren = [];
    let lastNodeChild = null;
    (0, _iterDecoJs.iterDeco)(node, innerDecorations, (widget, isNative, offset, index)=>{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const widgetMarks = widget.type.spec.marks ?? [];
        let key;
        if (isNative) {
            key = createKey(getInnerPos.current(), offset, "native-widget", reactKeys?.posToKey, widget, index);
            const child = {
                type: "native-widget",
                widget,
                marks: widgetMarks,
                offset,
                index,
                key
            };
            const prevChild = childMap.get(key);
            if (prevChild && areChildrenEqual(prevChild, child)) {
                prevChild.offset = offset;
            } else {
                childMap.set(key, child);
            }
            keysSeen.add(key);
        } else {
            key = createKey(getInnerPos.current(), offset, "widget", reactKeys?.posToKey, widget, index);
            const child = {
                type: "widget",
                widget: widget,
                marks: widgetMarks,
                offset,
                index,
                key
            };
            const prevChild = childMap.get(key);
            if (prevChild && areChildrenEqual(prevChild, child)) {
                prevChild.offset = offset;
            } else {
                childMap.set(key, child);
            }
            keysSeen.add(key);
        }
        const child = childMap.get(key);
        widgetChildren.push(child);
        adjustWidgetMarksForward(lastNodeChild, childMap.get(key));
    }, (childNode, outerDeco, innerDeco, offset)=>{
        const key = createKey(getInnerPos.current(), offset, "node", reactKeys?.posToKey);
        const child = {
            type: "node",
            node: childNode,
            marks: childNode.marks,
            innerDeco,
            outerDeco,
            offset,
            key
        };
        const prevChild = childMap.get(key);
        if (prevChild && areChildrenEqual(prevChild, child)) {
            prevChild.offset = offset;
            lastNodeChild = prevChild;
        } else {
            childMap.set(key, child);
            lastNodeChild = child;
        }
        keysSeen.add(key);
        adjustWidgetMarksBack(widgetChildren, lastNodeChild);
        widgetChildren = [];
    });
    for (const key of childMap.keys()){
        if (!keysSeen.has(key)) {
            childMap.delete(key);
        }
    }
    const children = Array.from(childMap.values()).sort((a, b)=>a.offset - b.offset);
    const childElements = createChildElements(children, getInnerPos);
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
