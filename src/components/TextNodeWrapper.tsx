import { Node } from "prosemirror-model";
import { DecorationSet } from "prosemirror-view";
import { Component } from "react";
import { findDOMNode } from "react-dom";

import {
  NodeViewDescriptorsContext,
  NodeViewDescriptorsContextValue,
} from "../contexts/NodeViewPositionsContext.js";
import { TextViewDesc, ViewDesc } from "../descriptors/ViewDesc.js";

type TextNodeWrapperProps = {
  node: Node;
  children: string;
  pos: number;
  siblingDescriptors: ViewDesc[];
};
export class TextNodeWrapper extends Component<TextNodeWrapperProps> {
  componentDidMount(): void {
    // There simply is no other way to ref a text node
    // eslint-disable-next-line react/no-find-dom-node
    const textNode = findDOMNode(this);
    if (!textNode) return;

    const { posToDesc, domToDesc } = this
      .context as NodeViewDescriptorsContextValue;

    const desc = new TextViewDesc(
      undefined,
      this.props.node,
      [],
      DecorationSet.empty,
      textNode,
      textNode,
      posToDesc,
      domToDesc
    );
    posToDesc.set(this.props.pos, desc);
    domToDesc.set(textNode, desc);
    this.props.siblingDescriptors.push(desc);
  }

  componentDidUpdate(): void {
    // There simply is no other way to ref a text node
    // eslint-disable-next-line react/no-find-dom-node
    const textNode = findDOMNode(this);
    if (!textNode) return;

    const { posToDesc, domToDesc } = this
      .context as NodeViewDescriptorsContextValue;

    const desc = new TextViewDesc(
      undefined,
      this.props.node,
      [],
      DecorationSet.empty,
      textNode,
      textNode,
      posToDesc,
      domToDesc
    );
    posToDesc.set(this.props.pos, desc);
    domToDesc.set(textNode, desc);
    this.props.siblingDescriptors.push(desc);
  }

  render() {
    return this.props.children;
  }
}
TextNodeWrapper.contextType = NodeViewDescriptorsContext;
