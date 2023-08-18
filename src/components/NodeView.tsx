import { DOMOutputSpec, Node } from "prosemirror-model";
import { NodeSelection } from "prosemirror-state";
import React, {
  ForwardRefExoticComponent,
  RefAttributes,
  cloneElement,
  useContext,
  useRef,
} from "react";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { EditorViewContext } from "../contexts/EditorViewContext.js";
import { NodeViewContext } from "../contexts/NodeViewContext.js";
import { NonWidgetType } from "../decorations/ReactWidgetType.js";
import { useChildNodeViews, wrapInDeco } from "../hooks/useChildNodeViews.js";
import { useNodeViewDescriptor } from "../hooks/useNodeViewDescriptor.js";
import { Decoration, DecorationSource } from "../prosemirror-view/index.js";

import { MarkView } from "./MarkView.js";
import { NodeViewComponentProps } from "./NodeViewComponentProps.js";
import { OutputSpec } from "./OutputSpec.js";

type NodeViewProps = {
  outerDeco: readonly Decoration[];
  pos: number;
  node: Node;
  innerDeco: DecorationSource;
};

export function NodeView({
  outerDeco,
  pos,
  node,
  innerDeco,
  ...props
}: NodeViewProps) {
  const domRef = useRef<HTMLElement | null>(null);
  const nodeDomRef = useRef<HTMLElement | null>(null);

  const childDescriptors = useNodeViewDescriptor(
    node,
    domRef,
    nodeDomRef,
    innerDeco,
    outerDeco
  );

  const view = useContext(EditorViewContext);
  const state = view?.state;
  const { nodeViews } = useContext(NodeViewContext);

  const children = useChildNodeViews(pos, node, innerDeco);

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
        decorations={outerDeco}
        innerDecorations={innerDeco}
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

  const decoratedElement = cloneElement(
    outerDeco.reduce(wrapInDeco, element),
    outerDeco.some((d) => (d.type as unknown as NonWidgetType).attrs.nodeName)
      ? { ref: domRef }
      : // If all of the node decorations were attr-only, then
        // we've already passed the domRef to the NodeView component
        // as a prop
        undefined
  );

  const markedElement = node.marks.reduce(
    (element, mark) => <MarkView mark={mark}>{element}</MarkView>,
    decoratedElement
  );

  return (
    <ChildDescriptorsContext.Provider value={childDescriptors}>
      {cloneElement(
        markedElement,
        node.marks.length ||
          outerDeco.some(
            (d) => (d.type as unknown as NonWidgetType).attrs.nodeName
          )
          ? { ref: domRef }
          : // If all of the node decorations were attr-only, then
            // we've already passed the domRef to the NodeView component
            // as a prop
            undefined
      )}
    </ChildDescriptorsContext.Provider>
  );
}
