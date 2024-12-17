import { Node } from "prosemirror-model";
import {
  Decoration,
  DecorationSource,
  NodeViewConstructor,
  NodeView as NodeViewT,
} from "prosemirror-view";
import React, { MutableRefObject, createElement, useContext } from "react";
import { createPortal } from "react-dom";

import { EditorContext } from "../contexts/EditorContext.js";
import { useClientOnly } from "../hooks/useClientOnly.js";

import { ChildNodeViews } from "./ChildNodeViews.js";

interface Props {
  customNodeViewRootRef: MutableRefObject<HTMLDivElement | null>;
  customNodeViewRef: MutableRefObject<NodeViewT | null>;
  contentDomRef: MutableRefObject<HTMLElement | null>;
  customNodeView: NodeViewConstructor;
  initialNode: MutableRefObject<Node>;
  node: Node;
  getPos: MutableRefObject<() => number>;
  initialOuterDeco: MutableRefObject<readonly Decoration[]>;
  initialInnerDeco: MutableRefObject<DecorationSource>;
  innerDeco: DecorationSource;
}

export function CustomNodeView({
  contentDomRef,
  customNodeViewRef,
  customNodeViewRootRef,
  customNodeView,
  initialNode,
  node,
  getPos,
  initialOuterDeco,
  initialInnerDeco,
  innerDeco,
}: Props) {
  const { view } = useContext(EditorContext);

  const shouldRender = useClientOnly();
  if (!shouldRender) return null;

  if (!customNodeViewRef.current) {
    customNodeViewRef.current = customNodeView(
      initialNode.current,
      // customNodeView will only be set if view is set, and we can only reach
      // this line if customNodeView is set
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      view!,
      () => getPos.current(),
      initialOuterDeco.current,
      initialInnerDeco.current
    );
  }
  const { contentDOM } = customNodeViewRef.current;
  contentDomRef.current = contentDOM ?? null;
  return createElement(
    node.isInline ? "span" : "div",
    {
      ref: customNodeViewRootRef,
      contentEditable: !!contentDOM,
      suppressContentEditableWarning: true,
    },
    contentDOM &&
      createPortal(
        <ChildNodeViews
          getPos={getPos}
          node={node}
          innerDecorations={innerDeco}
        />,
        contentDOM
      )
  );
}
