import { Component } from "react";
import { findDOMNode } from "react-dom";

import {
  NodeViewPositionsContext,
  NodeViewPositionsContextValue,
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

    const { posToDOM, domToPos } = this
      .context as NodeViewPositionsContextValue;
    posToDOM.set(this.props.pos, textNode);
    domToPos.set(textNode, this.props.pos);
  }

  componentDidUpdate(): void {
    // There simply is no other way to ref a text node
    // eslint-disable-next-line react/no-find-dom-node
    const textNode = findDOMNode(this);
    if (!textNode) return;

    const { posToDOM, domToPos } = this
      .context as NodeViewPositionsContextValue;
    posToDOM.set(this.props.pos, textNode);
    domToPos.set(textNode, this.props.pos);
  }

  render() {
    return this.props.children;
  }
}
TextNodeWrapper.contextType = NodeViewPositionsContext;
