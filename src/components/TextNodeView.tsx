import { Node } from "prosemirror-model";
import { DecorationSet } from "prosemirror-view";
import React, { Component, createElement } from "react";
import { findDOMNode } from "react-dom";

import {
  NodeViewContext,
  NodeViewContextValue,
} from "../contexts/NodeViewContext.js";
import { TextViewDesc, ViewDesc } from "../descriptors/ViewDesc.js";
import {
  DecorationInternal,
  NonWidgetType,
} from "../prosemirror-internal/DecorationInternal.js";

import { MarkView } from "./MarkView.js";

type Props = {
  node: Node;
  pos: number;
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
    return this.props.decorations.reduce(
      (element, deco) => {
        const {
          nodeName,
          class: className,
          style: _,
          ...attrs
        } = (deco.type as NonWidgetType).attrs;

        return createElement(
          nodeName ?? "span",
          {
            className,
            ...attrs,
          },
          element
        );
      },
      this.props.node.marks.reduce<JSX.Element>(
        (children, mark) => <MarkView mark={mark}>{children}</MarkView>,
        <>{this.props.node.text}</>
      )
    );
  }
}

TextNodeView.contextType = NodeViewContext;
