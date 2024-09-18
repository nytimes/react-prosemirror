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
const _useEditorStateJs = require("../hooks/useEditorState.js");
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
function InlineView(param) {
    let { innerPos , childViews  } = param;
    const { view  } = (0, _react.useContext)(_editorContextJs.EditorContext);
    const editorState = (0, _useEditorStateJs.useEditorState)();
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
        const firstMark = firstChild.marks[0];
        if (!firstMark) {
            return childViews.map((child)=>{
                const childPos = innerPos + child.offset;
                const childElement = child.type === "widget" ? /*#__PURE__*/ _react.default.createElement(_widgetViewJs.WidgetView, {
                    widget: child.widget,
                    pos: childPos
                }) : child.type === "native-widget" ? /*#__PURE__*/ _react.default.createElement(_nativeWidgetViewJs.NativeWidgetView, {
                    widget: child.widget,
                    pos: childPos
                }) : child.node.isText ? /*#__PURE__*/ _react.default.createElement(_childDescriptorsContextJs.ChildDescriptorsContext.Consumer, null, (siblingDescriptors)=>/*#__PURE__*/ _react.default.createElement(_textNodeViewJs.TextNodeView, {
                        view: view,
                        node: child.node,
                        pos: childPos,
                        siblingDescriptors: siblingDescriptors,
                        decorations: child.outerDeco
                    })) : /*#__PURE__*/ _react.default.createElement(_nodeViewJs.NodeView, {
                    node: child.node,
                    pos: childPos,
                    outerDeco: child.outerDeco,
                    innerDeco: child.innerDeco
                });
                return /*#__PURE__*/ (0, _react.cloneElement)(childElement, {
                    key: createKey(editorState.doc, innerPos, child, reactKeys?.posToKey)
                });
            });
        }
        return /*#__PURE__*/ _react.default.createElement(_markViewJs.MarkView, {
            key: createKey(editorState?.doc, innerPos, firstChild, reactKeys?.posToKey),
            mark: firstMark
        }, /*#__PURE__*/ _react.default.createElement(InlineView, {
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
function createChildElements(children, innerPos, doc, posToKey) {
    if (!children.length) return [];
    if (children.every((child)=>child.type !== "node" || child.node.isInline)) {
        return [
            /*#__PURE__*/ _react.default.createElement(InlineView, {
                key: createKey(doc, innerPos, // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                children[0], posToKey),
                childViews: children,
                innerPos: innerPos
            })
        ];
    }
    return children.map((child)=>{
        if (child.type === "node") {
            const pos = innerPos + child.offset;
            const key = posToKey?.get(pos) ?? pos;
            return /*#__PURE__*/ _react.default.createElement(_nodeViewJs.NodeView, {
                key: key,
                outerDeco: child.outerDeco,
                node: child.node,
                innerDeco: child.innerDeco,
                pos: pos
            });
        } else {
            return /*#__PURE__*/ _react.default.createElement(InlineView, {
                key: createKey(doc, innerPos, // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                child, posToKey),
                childViews: [
                    child
                ],
                innerPos: innerPos
            });
        }
    });
}
function ChildNodeViews(param) {
    let { pos , node , innerDecorations  } = param;
    const editorState = (0, _useEditorStateJs.useEditorState)();
    const reactKeys = (0, _useReactKeysJs.useReactKeys)();
    if (!node) return null;
    const innerPos = pos + 1;
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
    const childElements = createChildElements(children, innerPos, editorState.doc, reactKeys?.posToKey);
    const lastChild = children[children.length - 1];
    if (!lastChild || lastChild.type !== "node" || lastChild.node.isInline && !lastChild.node.isText || // RegExp.test actually handles undefined just fine
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    /\n$/.test(lastChild.node.text)) {
        childElements.push(/*#__PURE__*/ _react.default.createElement(_separatorHackViewJs.SeparatorHackView, {
            key: "trailing-hack-img"
        }), /*#__PURE__*/ _react.default.createElement(_trailingHackViewJs.TrailingHackView, {
            key: "trailing-hack-br"
        }));
    }
    return /*#__PURE__*/ _react.default.createElement(_react.default.Fragment, null, childElements);
}
