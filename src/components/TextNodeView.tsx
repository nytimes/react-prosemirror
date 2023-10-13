import { Node } from "prosemirror-model";
import { Component } from "react";
import { findDOMNode } from "react-dom";

import { Decoration, DecorationSet } from "../prosemirror-view/decoration.js";
import { EditorView } from "../prosemirror-view/index.js";
import {
  CompositionViewDesc,
  TextViewDesc,
  ViewDesc,
} from "../prosemirror-view/viewdesc.js";

import { wrapInDeco } from "./ChildNodeViews.js";

type Props = {
  view: EditorView | null;
  node: Node;
  pos: number;
  siblingDescriptors: ViewDesc[];
  decorations: readonly Decoration[];
};

export class TextNodeView extends Component<Props> {
  private renderRef: null | JSX.Element = null;

  updateEffect() {
    const { view, decorations, siblingDescriptors, node } = this.props;
    // There simply is no other way to ref a text node
    // eslint-disable-next-line react/no-find-dom-node
    const dom = findDOMNode(this);

    // We only need to explicitly create a CompositionViewDesc
    // when a composition was started that produces a new text node.
    // Otherwise we just rely on re-rendering the renderRef
    if (!dom) {
      if (!view?.composing) return;

      const desc = new CompositionViewDesc(
        undefined,
        // These are just placeholders/dummies. We can't
        // actually find the correct DOM nodes from here,
        // so we let our parent do it.
        // Passing a valid element here just so that the
        // ViewDesc constructor doesn't blow up.
        document.createElement("div"),
        document.createTextNode(node.text ?? ""),
        node.text ?? ""
      );
      siblingDescriptors.push(desc);
      return;
    }

    let textNode = dom;
    while (textNode.firstChild) {
      textNode = textNode.firstChild as Element | Text;
    }

    const desc = new TextViewDesc(
      undefined,
      [],
      node,
      decorations,
      DecorationSet.empty,
      dom,
      textNode
    );
    siblingDescriptors.push(desc);
  }

  componentDidMount(): void {
    this.updateEffect();
  }

  componentDidUpdate(): void {
    this.updateEffect();
  }

  render() {
    const { view, pos, node, decorations } = this.props;

    // During a composition, it's crucial that we don't try to
    // update the DOM that the user is working in. If there's
    // an active composition and the selection is in this node,
    // we freeze the DOM of this element so that it doesn't
    // interrupt the composition
    if (
      view?.composing &&
      view.state.selection.from >= pos &&
      view.state.selection.from <= pos + node.nodeSize
    ) {
      return this.renderRef;
    }

    this.renderRef = decorations.reduce(
      wrapInDeco,
      node.text as unknown as JSX.Element
    );

    return this.renderRef;
  }
}
