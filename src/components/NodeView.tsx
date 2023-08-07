import { DOMOutputSpec, Node } from "prosemirror-model";
import { NodeSelection } from "prosemirror-state";
import React, {
  ForwardRefExoticComponent,
  RefAttributes,
  useContext,
  useRef,
} from "react";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { NodeViewContext } from "../contexts/NodeViewContext.js";
import { useChildNodeViews } from "../hooks/useChildNodeViews.js";
import { useNodeViewDescriptor } from "../hooks/useNodeViewDescriptor.js";
import {
  DecorationInternal,
  DecorationSourceInternal,
} from "../prosemirror-internal/DecorationInternal.js";

import { NodeViewComponentProps } from "./NodeViewComponentProps.js";
import { OutputSpec } from "./OutputSpec.js";

type Props = {
  node: Node;
  pos: number;
  decorations: readonly DecorationInternal[];
  innerDecorations: DecorationSourceInternal;
};

export function NodeView({
  node,
  pos,
  decorations,
  innerDecorations,
  ...props
}: Props) {
  const { nodeViews, state } = useContext(NodeViewContext);
  const domRef = useRef<HTMLElement | null>(null);

  const childDescriptors = useNodeViewDescriptor(
    pos,
    node,
    domRef,
    innerDecorations
  );
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
        ref={domRef}
        node={node}
        pos={pos}
        decorations={decorations}
        innerDecorations={innerDecorations}
        isSelected={
          state.selection instanceof NodeSelection &&
          state.selection.node === node
        }
      >
        {children}
      </Component>
    );
  }

  const outputSpec: DOMOutputSpec | undefined = node.type.spec.toDOM?.(node);

  if (outputSpec) {
    element = (
      <OutputSpec {...props} ref={domRef} outputSpec={outputSpec}>
        {children}
      </OutputSpec>
    );
  }

  if (!element) {
    throw new Error(`Node spec for ${node.type.name} is missing toDOM`);
  }

  return (
    <ChildDescriptorsContext.Provider value={childDescriptors}>
      {element}
    </ChildDescriptorsContext.Provider>
  );
}
