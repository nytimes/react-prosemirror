import React, { cloneElement, createElement, memo, useContext, useRef } from "react";
import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { EditorContext } from "../contexts/EditorContext.js";
import { iterDeco } from "../decorations/iterDeco.js";
// import { useEditorState } from "../hooks/useEditorState.js";
import { useReactKeys } from "../hooks/useReactKeys.js";
import { htmlAttrsToReactProps, mergeReactProps } from "../props.js";
import { MarkView } from "./MarkView.js";
import { NativeWidgetView } from "./NativeWidgetView.js";
import { NodeView } from "./NodeView.js";
import { SeparatorHackView } from "./SeparatorHackView.js";
import { TextNodeView } from "./TextNodeView.js";
import { TrailingHackView } from "./TrailingHackView.js";
import { WidgetView } from "./WidgetView.js";
export function wrapInDeco(reactNode, deco) {
    const { nodeName , ...attrs } = deco.type.attrs;
    const props = htmlAttrsToReactProps(attrs);
    // We auto-wrap text nodes in spans so that we can apply attributes
    // and styles, but we want to avoid double-wrapping the same
    // text node
    if (nodeName || typeof reactNode === "string") {
        return /*#__PURE__*/ createElement(nodeName ?? "span", props, reactNode);
    }
    return /*#__PURE__*/ cloneElement(reactNode, mergeReactProps(reactNode.props, props));
}
function areChildrenEqual(a, b) {
    return a.type === b.type && a.marks.every((mark)=>mark.isInSet(b.marks)) && b.marks.every((mark)=>mark.isInSet(a.marks)) && a.key === b.key && (a.type === "node" ? a.outerDeco?.length === b.outerDeco?.length && a.outerDeco?.every((prevDeco)=>b.outerDeco?.some((nextDeco)=>prevDeco.from === nextDeco.from && prevDeco.to && nextDeco.to && prevDeco.type.eq(nextDeco.type))) && a.innerDeco.eq(b.innerDeco) : true) && a.node === b.node && a.widget === b.widget;
}
const ChildView = /*#__PURE__*/ memo(function ChildView(param) {
    let { child , getInnerPos  } = param;
    const { view  } = useContext(EditorContext);
    const getChildPos = useRef(()=>getInnerPos.current() + child.offset);
    getChildPos.current = ()=>getInnerPos.current() + child.offset;
    return child.type === "widget" ? /*#__PURE__*/ React.createElement(WidgetView, {
        key: child.key,
        widget: child.widget,
        getPos: getChildPos
    }) : child.type === "native-widget" ? /*#__PURE__*/ React.createElement(NativeWidgetView, {
        key: child.key,
        widget: child.widget,
        getPos: getChildPos
    }) : child.node.isText ? /*#__PURE__*/ React.createElement(ChildDescriptorsContext.Consumer, {
        key: child.key
    }, (param)=>/*#__PURE__*/ {
        let { siblingsRef , parentRef  } = param;
        return React.createElement(TextNodeView, {
            view: view,
            node: child.node,
            getPos: getChildPos,
            siblingsRef: siblingsRef,
            parentRef: parentRef,
            decorations: child.outerDeco
        });
    }) : /*#__PURE__*/ React.createElement(NodeView, {
        key: child.key,
        node: child.node,
        getPos: getChildPos,
        outerDeco: child.outerDeco,
        innerDeco: child.innerDeco
    });
});
const InlinePartition = /*#__PURE__*/ memo(function InlinePartition(param) {
    let { childViews , getInnerPos  } = param;
    const firstChild = childViews[0];
    const getFirstChildPos = useRef(()=>getInnerPos.current() + firstChild.offset);
    getFirstChildPos.current = ()=>getInnerPos.current() + firstChild.offset;
    const firstMark = firstChild.marks[0];
    if (!firstMark) {
        return /*#__PURE__*/ React.createElement(React.Fragment, null, childViews.map((child)=>{
            return /*#__PURE__*/ React.createElement(ChildView, {
                key: child.key,
                child: child,
                getInnerPos: getInnerPos
            });
        }));
    }
    return /*#__PURE__*/ React.createElement(MarkView, {
        getPos: getFirstChildPos,
        key: firstChild.key,
        mark: firstMark
    }, /*#__PURE__*/ React.createElement(InlineView, {
        key: firstChild.key,
        getInnerPos: getInnerPos,
        childViews: childViews.map((child)=>({
                ...child,
                marks: child.marks.slice(1)
            }))
    }));
});
const InlineView = /*#__PURE__*/ memo(function InlineView(param) {
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
    return /*#__PURE__*/ React.createElement(React.Fragment, null, partitioned.map((childViews)=>{
        const firstChild = childViews[0];
        if (!firstChild) return null;
        return /*#__PURE__*/ React.createElement(InlinePartition, {
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
const ChildElement = /*#__PURE__*/ memo(function ChildElement(param) {
    let { child , getInnerPos  } = param;
    const getNodePos = useRef(()=>getInnerPos.current() + child.offset);
    getNodePos.current = ()=>getInnerPos.current() + child.offset;
    if (child.type === "node") {
        return child.marks.reduce((element, mark)=>/*#__PURE__*/ React.createElement(MarkView, {
                getPos: getNodePos,
                mark: mark
            }, element), /*#__PURE__*/ React.createElement(NodeView, {
            key: child.key,
            outerDeco: child.outerDeco,
            node: child.node,
            innerDeco: child.innerDeco,
            getPos: getNodePos
        }));
    } else {
        return /*#__PURE__*/ React.createElement(InlineView, {
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
            /*#__PURE__*/ React.createElement(InlineView, {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                key: children[0].key,
                childViews: children,
                getInnerPos: getInnerPos
            })
        ];
    }
    return children.map((child)=>{
        return /*#__PURE__*/ React.createElement(ChildElement, {
            key: child.key,
            child: child,
            getInnerPos: getInnerPos
        });
    });
}
export const ChildNodeViews = /*#__PURE__*/ memo(function ChildNodeViews(param) {
    let { getPos , node , innerDecorations  } = param;
    // const editorState = useEditorState();
    const reactKeys = useReactKeys();
    const getInnerPos = useRef(()=>getPos.current() + 1);
    const childMap = useRef(new Map()).current;
    if (!node) return null;
    const keysSeen = new Set();
    let widgetChildren = [];
    let lastNodeChild = null;
    iterDeco(node, innerDecorations, (widget, isNative, offset, index)=>{
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
        childElements.push(/*#__PURE__*/ React.createElement(SeparatorHackView, {
            getPos: getInnerPos,
            key: "trailing-hack-img"
        }), /*#__PURE__*/ React.createElement(TrailingHackView, {
            getPos: getInnerPos,
            key: "trailing-hack-br"
        }));
    }
    return /*#__PURE__*/ React.createElement(React.Fragment, null, childElements);
});
