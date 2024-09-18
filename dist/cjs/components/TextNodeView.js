"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TextNodeView", {
    enumerable: true,
    get: ()=>TextNodeView
});
const _prosemirrorView = require("prosemirror-view");
const _react = require("react");
const _reactDom = require("react-dom");
const _viewdescJs = require("../viewdesc.js");
const _childNodeViewsJs = require("./ChildNodeViews.js");
let TextNodeView = class TextNodeView extends _react.Component {
    updateEffect() {
        const { decorations , siblingDescriptors , node  } = this.props;
        // There simply is no other way to ref a text node
        // eslint-disable-next-line react/no-find-dom-node
        const dom = (0, _reactDom.findDOMNode)(this);
        // We only need to explicitly create a CompositionViewDesc
        // when a composition was started that produces a new text node.
        // Otherwise we just rely on re-rendering the renderRef
        if (!dom) {
            return;
        }
        let textNode = dom;
        while(textNode.firstChild){
            textNode = textNode.firstChild;
        }
        if (!this.viewDescRef || this.viewDescRef instanceof _viewdescJs.CompositionViewDesc) {
            this.viewDescRef = new _viewdescJs.TextViewDesc(undefined, [], node, decorations, _prosemirrorView.DecorationSet.empty, dom, textNode);
        } else {
            this.viewDescRef.parent = undefined;
            this.viewDescRef.children = [];
            this.viewDescRef.node = node;
            this.viewDescRef.outerDeco = decorations;
            this.viewDescRef.innerDeco = _prosemirrorView.DecorationSet.empty;
            this.viewDescRef.dom = dom;
            // @ts-expect-error We have our own ViewDesc implementations
            this.viewDescRef.dom.pmViewDesc = this.viewDescRef;
            this.viewDescRef.nodeDOM = textNode;
        }
        siblingDescriptors.push(this.viewDescRef);
    }
    componentDidMount() {
        this.updateEffect();
    }
    componentDidUpdate() {
        this.updateEffect();
    }
    render() {
        const { node , decorations  } = this.props;
        return decorations.reduce(_childNodeViewsJs.wrapInDeco, node.text);
    }
    constructor(...args){
        super(...args);
        this.viewDescRef = null;
    }
};
