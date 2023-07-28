import { Component } from "react";
import { findDOMNode } from "react-dom";

import {
  NodeViewDescriptor,
  NodeViewDescriptorsContext,
  NodeViewDescriptorsContextValue,
} from "../contexts/NodeViewPositionsContext.js";

type TextNodeWrapperProps = {
  children: string;
  pos: number;
};
export class TextNodeWrapper extends Component<TextNodeWrapperProps> {
  componentDidMount(): void {
    // There simply is no other way to ref a text node
    // eslint-disable-next-line react/no-find-dom-node
    const textNode = findDOMNode(this);
    if (!textNode) return;

    const { posToDesc, domToDesc } = this
      .context as NodeViewDescriptorsContextValue;

    const desc: NodeViewDescriptor = {
      pos: this.props.pos,
      dom: textNode,
      contentDOM: null,
    };
    posToDesc.set(this.props.pos, desc);
    domToDesc.set(textNode, desc);
  }

  componentDidUpdate(): void {
    // There simply is no other way to ref a text node
    // eslint-disable-next-line react/no-find-dom-node
    const textNode = findDOMNode(this);
    if (!textNode) return;

    const { posToDesc, domToDesc } = this
      .context as NodeViewDescriptorsContextValue;

    const desc: NodeViewDescriptor = {
      pos: this.props.pos,
      dom: textNode,
      contentDOM: null,
    };
    posToDesc.set(this.props.pos, desc);
    domToDesc.set(textNode, desc);
  }

  render() {
    return this.props.children;
  }
}
TextNodeWrapper.contextType = NodeViewDescriptorsContext;
