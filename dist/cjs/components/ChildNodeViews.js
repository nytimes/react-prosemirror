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
const _dedupe = /*#__PURE__*/ _interopRequireDefault(require("classnames/dedupe"));
const _react = /*#__PURE__*/ _interopRequireWildcard(require("react"));
const _childDescriptorsContextJs = require("../contexts/ChildDescriptorsContext.js");
const _editorContextJs = require("../contexts/EditorContext.js");
const _iterDecoJs = require("../decorations/iterDeco.js");
const _useEditorStateJs = require("../hooks/useEditorState.js");
const _useReactKeysJs = require("../hooks/useReactKeys.js");
const _markViewJs = require("./MarkView.js");
const _nativeWidgetViewJs = require("./NativeWidgetView.js");
const _nodeViewJs = require("./NodeView.js");
const _textNodeViewJs = require("./TextNodeView.js");
const _trailingHackViewJs = require("./TrailingHackView.js");
const _widgetViewJs = require("./WidgetView.js");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
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
function wrapInDeco(reactNode, deco) {
    const { nodeName , class: className , style: css , contenteditable: contentEditable , spellcheck: spellCheck , ...attrs } = deco.type.attrs;
    // We auto-wrap text nodes in spans so that we can apply attributes
    // and styles, but we want to avoid double-wrapping the same
    // text node
    if (nodeName || typeof reactNode === "string") {
        return /*#__PURE__*/ (0, _react.createElement)(nodeName ?? "span", {
            className,
            contentEditable,
            spellCheck,
            style: css && cssToStyles(css),
            ...attrs
        }, reactNode);
    }
    return /*#__PURE__*/ (0, _react.cloneElement)(reactNode, {
        className: (0, _dedupe.default)(reactNode.props.className, className),
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
                    key: createKey(editorState?.doc, innerPos, child, reactKeys?.posToKey)
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
function ChildNodeViews(param) {
    let { pos , node , innerDecorations  } = param;
    const editorState = (0, _useEditorStateJs.useEditorState)();
    const reactKeys = (0, _useReactKeysJs.useReactKeys)();
    if (!node) return null;
    const children = [];
    const innerPos = pos + 1;
    const queuedChildNodes = [];
    (0, _iterDecoJs.iterDeco)(node, innerDecorations, (widget, isNative, offset, index)=>{
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
                children.push(/*#__PURE__*/ _react.default.createElement(InlineView, {
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
            children.push(/*#__PURE__*/ _react.default.createElement(_nodeViewJs.NodeView, {
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
        children.push(/*#__PURE__*/ _react.default.createElement(InlineView, {
            key: createKey(editorState?.doc, innerPos, // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            queuedChildNodes[0], reactKeys?.posToKey),
            childViews: queuedChildNodes,
            innerPos: innerPos
        }));
    }
    if (!children.length) {
        children.push(/*#__PURE__*/ _react.default.createElement(_trailingHackViewJs.TrailingHackView, {
            key: createKey(editorState?.doc, innerPos, {
                type: "trailinghack",
                offset: 0
            }, reactKeys?.posToKey)
        }));
    }
    return /*#__PURE__*/ _react.default.createElement(_react.default.Fragment, null, children);
}
