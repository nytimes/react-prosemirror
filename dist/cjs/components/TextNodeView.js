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
function shallowEqual(objA, objB) {
    if (objA === objB) {
        return true;
    }
    if (!objA || !objB) {
        return false;
    }
    const aKeys = Object.keys(objA);
    const bKeys = Object.keys(objB);
    const len = aKeys.length;
    if (bKeys.length !== len) {
        return false;
    }
    for(let i = 0; i < len; i++){
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const key = aKeys[i];
        if (objA[key] !== objB[key] || !Object.prototype.hasOwnProperty.call(objB, key)) {
            return false;
        }
    }
    return true;
}
let TextNodeView = class TextNodeView extends _react.Component {
    updateEffect() {
        const { view , decorations , siblingsRef , parentRef , getPos , node  } = this.props;
        // There simply is no other way to ref a text node
        // eslint-disable-next-line react/no-find-dom-node
        const dom = (0, _reactDom.findDOMNode)(this);
        // We only need to explicitly create a CompositionViewDesc
        // when a composition was started that produces a new text node.
        // Otherwise we just rely on re-rendering the renderRef
        if (!dom) {
            if (!view?.composing) return;
            this.viewDescRef = new _viewdescJs.CompositionViewDesc(parentRef.current, getPos.current(), // These are just placeholders/dummies. We can't
            // actually find the correct DOM nodes from here,
            // so we let our parent do it.
            // Passing a valid element here just so that the
            // ViewDesc constructor doesn't blow up.
            document.createElement("div"), document.createTextNode(node.text ?? ""), node.text ?? "");
            return;
        }
        let textNode = dom;
        while(textNode.firstChild){
            textNode = textNode.firstChild;
        }
        if (!this.viewDescRef || this.viewDescRef instanceof _viewdescJs.CompositionViewDesc) {
            this.viewDescRef = new _viewdescJs.TextViewDesc(undefined, [], getPos.current(), node, decorations, _prosemirrorView.DecorationSet.empty, dom, textNode);
        } else {
            this.viewDescRef.parent = parentRef.current;
            this.viewDescRef.children = [];
            this.viewDescRef.node = node;
            this.viewDescRef.pos = getPos.current();
            this.viewDescRef.outerDeco = decorations;
            this.viewDescRef.innerDeco = _prosemirrorView.DecorationSet.empty;
            this.viewDescRef.dom = dom;
            // @ts-expect-error We have our own ViewDesc implementations
            this.viewDescRef.dom.pmViewDesc = this.viewDescRef;
            this.viewDescRef.nodeDOM = textNode;
        }
        if (!siblingsRef.current.includes(this.viewDescRef)) {
            siblingsRef.current.push(this.viewDescRef);
        }
        siblingsRef.current.sort((a, b)=>a.pos - b.pos);
    }
    shouldComponentUpdate(nextProps) {
        return !shallowEqual(this.props, nextProps);
    }
    componentDidMount() {
        this.updateEffect();
    }
    componentDidUpdate() {
        this.updateEffect();
    }
    componentWillUnmount() {
        const { siblingsRef  } = this.props;
        if (!this.viewDescRef) return;
        if (siblingsRef.current.includes(this.viewDescRef)) {
            const index = siblingsRef.current.indexOf(this.viewDescRef);
            siblingsRef.current.splice(index, 1);
        }
    }
    render() {
        const { view , getPos , node , decorations  } = this.props;
        // During a composition, it's crucial that we don't try to
        // update the DOM that the user is working in. If there's
        // an active composition and the selection is in this node,
        // we freeze the DOM of this element so that it doesn't
        // interrupt the composition
        if (view?.composing && view.state.selection.from >= getPos.current() && view.state.selection.from <= getPos.current() + node.nodeSize) {
            return this.renderRef;
        }
        this.renderRef = decorations.reduce(_childNodeViewsJs.wrapInDeco, node.text);
        return this.renderRef;
    }
    constructor(...args){
        super(...args);
        this.viewDescRef = null;
        this.renderRef = null;
    }
};
