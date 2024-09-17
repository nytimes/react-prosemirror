import { Node } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import { Component } from "react";
import { findDOMNode } from "react-dom";

import { reactKeysPluginKey } from "../plugins/reactKeys.js";
import { CompositionViewDesc, TextViewDesc, ViewDesc } from "../viewdesc.js";

import { wrapInDeco } from "./ChildNodeViews.js";

type Props = {
  view: EditorView | null;
  state: EditorState | null;
  node: Node;
  pos: number;
  viewDescContext: Record<string, ViewDesc>;
  decorations: readonly Decoration[];
};

export class TextNodeView extends Component<Props> {
  private viewDescRef: null | TextViewDesc = null;

  updateEffect() {
    const { decorations, viewDescContext, node, state, pos } = this.props;
    const reactKeysState = state && reactKeysPluginKey.getState(state);
    const key = reactKeysState?.posToKey.get(pos);
    const parentKey = key && reactKeysState?.keyToParent.get(key);
    const parent =
      parentKey !== undefined ? viewDescContext[parentKey] : undefined;

    // There simply is no other way to ref a text node
    // eslint-disable-next-line react/no-find-dom-node
    const dom = findDOMNode(this);

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
      this.viewDescRef.parent = parent;
      this.viewDescRef.children = [];
      this.viewDescRef.node = node;
      this.viewDescRef.outerDeco = decorations;
      this.viewDescRef.innerDeco = DecorationSet.empty;
      this.viewDescRef.dom = dom;
      // @ts-expect-error We have our own ViewDesc implementations
      this.viewDescRef.dom.pmViewDesc = this.viewDescRef;
      this.viewDescRef.nodeDOM = textNode;
    }

    if (key) {
      viewDescContext[key] = this.viewDescRef;
    }
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
