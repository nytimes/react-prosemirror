import { DOMOutputSpec, Node } from "prosemirror-model";
import { NodeSelection } from "prosemirror-state";
import React, {
  ForwardRefExoticComponent,
  MutableRefObject,
  RefAttributes,
  useContext,
} from "react";

import { EditorViewContext } from "../contexts/EditorViewContext.js";
import { NodeViewContext } from "../contexts/NodeViewContext.js";
import { useChildNodeViews } from "../hooks/useChildNodeViews.js";
import {
  Decoration,
  DecorationSource,
} from "../prosemirror-view/decoration.js";

import { NodeViewComponentProps } from "./NodeViewComponentProps.js";
import { OutputSpec } from "./OutputSpec.js";

type Props = {
  node: Node;
  pos: number;
  decorations: readonly Decoration[];
  innerDecorations: DecorationSource;
  nodeDomRef: MutableRefObject<HTMLElement | null>;
  domRef?: MutableRefObject<HTMLElement | null>;
};

export function NodeView({
  node,
  pos,
  decorations,
  innerDecorations,
  domRef,
  nodeDomRef,
  ...props
}: Props) {
  const view = useContext(EditorViewContext);
  const state = view?.state;
  const { nodeViews } = useContext(NodeViewContext);

  const children = useChildNodeViews(pos, node, innerDecorations);

  let element: JSX.Element | null = null;

  const Component:
    | ForwardRefExoticComponent<
        NodeViewComponentProps & RefAttributes<HTMLElement>
      >
    | undefined = nodeViews[node.type.name];

  if (Component) {
    element = (
      <Component
        {...props}
        ref={nodeDomRef}
        node={node}
        pos={pos}
        decorations={decorations}
        innerDecorations={innerDecorations}
        isSelected={
          state?.selection instanceof NodeSelection &&
          state.selection.node === node
        }
      >
        {children}
      </Component>
    );
  } else {
    const outputSpec: DOMOutputSpec | undefined = node.type.spec.toDOM?.(node);

    if (outputSpec) {
      element = (
        <OutputSpec {...props} ref={nodeDomRef} outputSpec={outputSpec}>
          {children}
        </OutputSpec>
      );
    }
  }

  if (!element) {
    throw new Error(`Node spec for ${node.type.name} is missing toDOM`);
  }

  return element;
}
