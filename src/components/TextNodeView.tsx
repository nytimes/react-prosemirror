import { Node } from "prosemirror-model";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import { Component } from "react";
import { findDOMNode } from "react-dom";

import { CompositionViewDesc, TextViewDesc, ViewDesc } from "../viewdesc.js";

import { wrapInDeco } from "./ChildNodeViews.js";

type Props = {
  view: EditorView | null;
  node: Node;
  pos: number;
  siblingDescriptors: ViewDesc[];
  decorations: readonly Decoration[];
};

export class TextNodeView extends Component<Props> {
  private viewDescRef: null | TextViewDesc = null;

  updateEffect() {
    const { decorations, siblingDescriptors, node } = this.props;
    // There simply is no other way to ref a text node
    // eslint-disable-next-line react/no-find-dom-node
    const dom = findDOMNode(this);

    // We only need to explicitly create a CompositionViewDesc
    // when a composition was started that produces a new text node.
    // Otherwise we just rely on re-rendering the renderRef
    if (!dom) {
      return;
    }

    let textNode = dom;
    while (textNode.firstChild) {
      textNode = textNode.firstChild as Element | Text;
    }

    if (!this.viewDescRef || this.viewDescRef instanceof CompositionViewDesc) {
      this.viewDescRef = new TextViewDesc(
        undefined,
        [],
        node,
        decorations,
        DecorationSet.empty,
        dom,
        textNode
      );
    } else {
      this.viewDescRef.parent = undefined;
      this.viewDescRef.children = [];
      this.viewDescRef.node = node;
      this.viewDescRef.outerDeco = decorations;
      this.viewDescRef.innerDeco = DecorationSet.empty;
      this.viewDescRef.dom = dom;
      this.viewDescRef.nodeDOM = textNode;
    }

    siblingDescriptors.push(this.viewDescRef);
  }

  componentDidMount(): void {
    this.updateEffect();
  }

  componentDidUpdate(): void {
    this.updateEffect();
  }

  render() {
    const { node, decorations } = this.props;

    return decorations.reduce(wrapInDeco, node.text as unknown as JSX.Element);
  }
}
