import classnames from "classnames/dedupe";
import React, { cloneElement, createElement, useContext } from "react";
import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { EditorContext } from "../contexts/EditorContext.js";
import { iterDeco } from "../decorations/iterDeco.js";
import { useEditorState } from "../hooks/useEditorState.js";
import { useReactKeys } from "../hooks/useReactKeys.js";
import { MarkView } from "./MarkView.js";
import { NativeWidgetView } from "./NativeWidgetView.js";
import { NodeView } from "./NodeView.js";
import { TextNodeView } from "./TextNodeView.js";
import { TrailingHackView } from "./TrailingHackView.js";
import { WidgetView } from "./WidgetView.js";
function cssToStyles(css) {
    const cssJson = `{"${css.replace(/;? *$/, "").replace(/;+ */g, '","').replace(/: */g, '":"')}"}`;
    const obj = JSON.parse(cssJson);
    return Object.keys(obj).reduce((acc, key)=>{
        const camelCased = key.startsWith("--") ? key : key.replace(/-[a-z]/g, (g)=>g[1]?.toUpperCase() ?? "");
        return {
            ...acc,
            [camelCased]: obj[key]
        };
    }, {});
}
export function wrapInDeco(reactNode, deco) {
    const { nodeName , class: className , style: css , contenteditable: contentEditable , spellcheck: spellCheck , ...attrs } = deco.type.attrs;
    // We auto-wrap text nodes in spans so that we can apply attributes
    // and styles, but we want to avoid double-wrapping the same
    // text node
    if (nodeName || typeof reactNode === "string") {
        return /*#__PURE__*/ createElement(nodeName ?? "span", {
            className,
            contentEditable,
            spellCheck,
            style: css && cssToStyles(css),
            ...attrs
        }, reactNode);
    }
    return /*#__PURE__*/ cloneElement(reactNode, {
        className: classnames(reactNode.props.className, className),
        contentEditable,
        spellCheck,
        style: {
            ...reactNode.props.style,
            ...css && cssToStyles(css)
        },
        ...attrs
    });
}
function InlineView(param) {
    let { innerPos , childViews  } = param;
    const { view  } = useContext(EditorContext);
    const editorState = useEditorState();
    const reactKeys = useReactKeys();
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
        const firstMark = firstChild.marks[0];
        if (!firstMark) {
            return childViews.map((child)=>{
                const childPos = innerPos + child.offset;
                const childElement = child.type === "widget" ? /*#__PURE__*/ React.createElement(WidgetView, {
                    widget: child.widget,
                    pos: childPos
                }) : child.type === "native-widget" ? /*#__PURE__*/ React.createElement(NativeWidgetView, {
                    widget: child.widget,
                    pos: childPos
                }) : child.node.isText ? /*#__PURE__*/ React.createElement(ChildDescriptorsContext.Consumer, null, (siblingDescriptors)=>/*#__PURE__*/ React.createElement(TextNodeView, {
                        view: view,
                        node: child.node,
                        pos: childPos,
                        siblingDescriptors: siblingDescriptors,
                        decorations: child.outerDeco
                    })) : /*#__PURE__*/ React.createElement(NodeView, {
                    node: child.node,
                    pos: childPos,
                    outerDeco: child.outerDeco,
                    innerDeco: child.innerDeco
                });
                return /*#__PURE__*/ cloneElement(childElement, {
                    key: createKey(editorState?.doc, innerPos, child, reactKeys?.posToKey)
                });
            });
        }
        return /*#__PURE__*/ React.createElement(MarkView, {
            key: createKey(editorState?.doc, innerPos, firstChild, reactKeys?.posToKey),
            mark: firstMark
        }, /*#__PURE__*/ React.createElement(InlineView, {
            key: createKey(editorState?.doc, innerPos, firstChild, reactKeys?.posToKey),
            innerPos: innerPos,
            childViews: childViews.map((child)=>({
                    ...child,
                    marks: child.marks.slice(1)
                }))
        }));
    }));
}
function createKey(doc, innerPos, child, posToKey) {
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
    if (!doc) return pos;
    const parentPos = doc.resolve(pos).start() - 1;
    const parentKey = posToKey?.get(parentPos);
    if (parentKey) return `${parentKey}-${child.offset}`;
    return pos;
}
function adjustWidgetMarks(children) {
    const lastChild = children[children.length - 1];
    if (lastChild?.type !== "node") return;
    const marksToSpread = lastChild.marks;
    for(let i = children.length - 2; i >= 0; i--){
        const child = children[i];
        if (child?.type !== "widget" || child.widget.type.side < 0) break;
        child.marks = child.marks.reduce((acc, mark)=>mark.addToSet(acc), marksToSpread);
    }
}
export function ChildNodeViews(param) {
    let { pos , node , innerDecorations  } = param;
    const editorState = useEditorState();
    const reactKeys = useReactKeys();
    if (!node) return null;
    const children = [];
    const innerPos = pos + 1;
    const queuedChildNodes = [];
    iterDeco(node, innerDecorations, (widget, isNative, offset, index)=>{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const widgetMarks = widget.type.spec.marks ?? [];
        if (isNative) {
            queuedChildNodes.push({
                type: "native-widget",
                widget: widget,
                marks: // eslint-disable-next-line @typescript-eslint/no-explicit-any
                widget.type.side >= 0 ? widgetMarks : widgetMarks.reduce((acc, mark)=>mark.addToSet(acc), queuedChildNodes[0]?.marks ?? []),
                offset,
                index
            });
        } else {
            queuedChildNodes.push({
                type: "widget",
                widget: widget,
                marks: // eslint-disable-next-line @typescript-eslint/no-explicit-any
                widget.type.side >= 0 ? widgetMarks : widgetMarks.reduce((acc, mark)=>mark.addToSet(acc), queuedChildNodes[0]?.marks ?? []),
                offset,
                index
            });
        }
    }, (childNode, outerDeco, innerDeco, offset)=>{
        if (!childNode.isInline) {
            if (queuedChildNodes.length) {
                children.push(/*#__PURE__*/ React.createElement(InlineView, {
                    key: createKey(editorState?.doc, innerPos, // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    queuedChildNodes[0], reactKeys?.posToKey),
                    childViews: [
                        ...queuedChildNodes
                    ],
                    innerPos: innerPos
                }));
                queuedChildNodes.splice(0, queuedChildNodes.length);
            }
            const pos = innerPos + offset;
            const key = reactKeys?.posToKey.get(pos) ?? pos;
            children.push(/*#__PURE__*/ React.createElement(NodeView, {
                key: key,
                outerDeco: outerDeco,
                node: childNode,
                innerDeco: innerDeco,
                pos: pos
            }));
            return;
        }
        queuedChildNodes.push({
            type: "node",
            node: childNode,
            marks: childNode.marks,
            innerDeco,
            outerDeco,
            offset
        });
        adjustWidgetMarks(queuedChildNodes);
    });
    if (queuedChildNodes.length) {
        children.push(/*#__PURE__*/ React.createElement(InlineView, {
            key: createKey(editorState?.doc, innerPos, // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            queuedChildNodes[0], reactKeys?.posToKey),
            childViews: queuedChildNodes,
            innerPos: innerPos
        }));
    }
    if (!children.length) {
        children.push(/*#__PURE__*/ React.createElement(TrailingHackView, {
            key: createKey(editorState?.doc, innerPos, {
                type: "trailinghack",
                offset: 0
            }, reactKeys?.posToKey)
        }));
    }
    return /*#__PURE__*/ React.createElement(React.Fragment, null, children);
}
