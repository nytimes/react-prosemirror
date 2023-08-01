import { Node } from "prosemirror-model";
import { DecorationSet } from "prosemirror-view";
import React, { Component } from "react";
import { findDOMNode } from "react-dom";

import {
  NodeViewContext,
  NodeViewContextValue,
} from "../contexts/NodeViewContext.js";
import { TextViewDesc, ViewDesc } from "../descriptors/ViewDesc.js";

import { OutputSpec } from "./OutputSpec.js";

type Props = {
  node: Node;
  pos: number;
  siblingDescriptors: ViewDesc[];
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

    const { posToDesc, domToDesc } = this.context as NodeViewContextValue;

    const desc = new TextViewDesc(
      undefined,
      this.props.node,
      [],
      DecorationSet.empty,
      textNode,
      nodeDom,
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
    const nodeDom = findDOMNode(this);
    if (!nodeDom) return;
    let textNode = nodeDom;

    while (!(textNode instanceof Text) && textNode.firstChild) {
      textNode = textNode?.firstChild as Element | Text;
    }

    const { posToDesc, domToDesc } = this.context as NodeViewContextValue;

    const desc = new TextViewDesc(
      undefined,
      this.props.node,
      [],
      DecorationSet.empty,
      textNode,
      nodeDom,
      posToDesc,
      domToDesc
    );
    posToDesc.set(this.props.pos, desc);
    domToDesc.set(textNode, desc);
    this.props.siblingDescriptors.push(desc);
  }

  render() {
    return this.props.node.marks.reduce<JSX.Element>((children, mark) => {
      const outputSpec = mark.type.spec.toDOM?.(mark, true);
      if (!outputSpec)
        throw new Error(`Mark spec for ${mark.type.name} is missing toDOM`);

      return <OutputSpec outputSpec={outputSpec}>{children}</OutputSpec>;
    }, <>{this.props.node.text}</>);
  }
}

TextNodeView.contextType = NodeViewContext;
