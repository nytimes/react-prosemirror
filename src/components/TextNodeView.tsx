import { Node } from "prosemirror-model";
import { DecorationSet } from "prosemirror-view";
import { Component } from "react";
import { findDOMNode } from "react-dom";

import { DecorationInternal } from "../prosemirror-view/DecorationInternal.js";
import { TextViewDesc, ViewDesc } from "../prosemirror-view/viewdesc.js";

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

    const desc = new TextViewDesc(
      undefined,
      [],
      this.props.node,
      [],
      DecorationSet.empty,
      textNode,
      nodeDom
    );
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

    const desc = new TextViewDesc(
      undefined,
      [],
      this.props.node,
      [],
      DecorationSet.empty,
      textNode,
      nodeDom
    );
    this.props.siblingDescriptors.push(desc);
  }

  render() {
    return this.props.node.text;
  }
}
