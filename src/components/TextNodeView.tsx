import { Node } from "prosemirror-model";
import { DecorationSet } from "prosemirror-view";
import { Component } from "react";
import { findDOMNode } from "react-dom";

import {
  NodeViewContext,
  NodeViewContextValue,
} from "../contexts/NodeViewContext.js";
import { TextViewDesc, ViewDesc } from "../descriptors/ViewDesc.js";
import { DecorationInternal } from "../prosemirror-internal/DecorationInternal.js";

type Props = {
  node: Node;
  siblingDescriptors: ViewDesc[];
  decorations: readonly DecorationInternal[];
};

export class TextNodeView extends Component<Props> {
  componentDidMount(): void {
    // There simply is no other way to ref a text node
    // eslint-disable-next-line react/no-find-dom-node
    const nodeDom = findDOMNode(this);
    if (!nodeDom) return;
    let textNode = nodeDom;

    while (!(textNode instanceof Text) && textNode.firstChild) {
      textNode = textNode?.firstChild as Element | Text;
    }

    const { domToDesc } = this.context as NodeViewContextValue;

    const desc = new TextViewDesc(
      undefined,
      this.props.node,
      [],
      DecorationSet.empty,
      textNode,
      nodeDom,
      domToDesc
    );
    domToDesc.set(textNode, desc);
    this.props.siblingDescriptors.push(desc);
  }

  componentDidUpdate(): void {
    // There simply is no other way to ref a text node
    // eslint-disable-next-line react/no-find-dom-node
    const nodeDom = findDOMNode(this);
    if (!nodeDom) return;
    let textNode = nodeDom;

    while (!(textNode instanceof Text) && textNode.firstChild) {
      textNode = textNode?.firstChild as Element | Text;
    }

    const { domToDesc } = this.context as NodeViewContextValue;

    const desc = new TextViewDesc(
      undefined,
      this.props.node,
      [],
      DecorationSet.empty,
      textNode,
      nodeDom,
      domToDesc
    );
    domToDesc.set(textNode, desc);
    this.props.siblingDescriptors.push(desc);
  }

  render() {
    return this.props.node.text;
  }
}

TextNodeView.contextType = NodeViewContext;
