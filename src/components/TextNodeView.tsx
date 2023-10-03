import { Node } from "prosemirror-model";
import { Component } from "react";
import { findDOMNode } from "react-dom";

import { Decoration, DecorationSet } from "../prosemirror-view/decoration.js";
import { EditorView } from "../prosemirror-view/index.js";
import { TextViewDesc, ViewDesc } from "../prosemirror-view/viewdesc.js";

import { wrapInDeco } from "./ChildNodeViews.js";

type Props = {
  view: EditorView | null;
  node: Node;
  siblingDescriptors: ViewDesc[];
  decorations: readonly Decoration[];
};

export class TextNodeView extends Component<Props> {
  private renderRef: null | JSX.Element = null;

  componentDidMount(): void {
    // There simply is no other way to ref a text node
    // eslint-disable-next-line react/no-find-dom-node
    const dom = findDOMNode(this);
    if (!dom) return;

    let textNode = dom;
    while (textNode.firstChild) {
      textNode = textNode.firstChild as Element | Text;
    }

    const desc = new TextViewDesc(
      undefined,
      [],
      this.props.node,
      this.props.decorations,
      DecorationSet.empty,
      dom,
      textNode
    );
    this.props.siblingDescriptors.push(desc);
  }

  componentDidUpdate(): void {
    // There simply is no other way to ref a text node
    // eslint-disable-next-line react/no-find-dom-node
    const dom = findDOMNode(this);
    if (!dom) return;

    let textNode = dom;
    while (textNode.firstChild) {
      textNode = textNode.firstChild as Element | Text;
    }

    const desc = new TextViewDesc(
      undefined,
      [],
      this.props.node,
      this.props.decorations,
      DecorationSet.empty,
      dom,
      textNode
    );
    this.props.siblingDescriptors.push(desc);
  }

  render() {
    if (this.props.view?.composing) {
      return this.renderRef;
    }

    this.renderRef = this.props.decorations.reduce(
      wrapInDeco,
      this.props.node.text as unknown as JSX.Element
    );

    return this.renderRef;
  }
}
