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
import { NodeViewContext } from "../contexts/NodeViewContext.js";
import { NonWidgetType } from "../decorations/ReactWidgetType.js";
import { useEditorState } from "../hooks/useEditorState.js";
import { useNodeViewDescriptor } from "../hooks/useNodeViewDescriptor.js";
import { Decoration, DecorationSource } from "../prosemirror-view/index.js";

import { ChildNodeViews, wrapInDeco } from "./ChildNodeViews.js";
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

  const state = useEditorState();
  const { nodeViews } = useContext(NodeViewContext);

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
        nodeProps={{
          node: node,
          pos: pos,
          decorations: outerDeco,
          innerDecorations: innerDeco,
          isSelected:
            state?.selection instanceof NodeSelection &&
            state.selection.node === node,
        }}
      >
        <ChildNodeViews pos={pos} node={node} innerDecorations={innerDeco} />
      </Component>
    );
  } else {
    const outputSpec: DOMOutputSpec | undefined = node.type.spec.toDOM?.(node);

    if (outputSpec) {
      element = (
        <OutputSpec {...props} ref={nodeDomRef} outputSpec={outputSpec}>
          <ChildNodeViews pos={pos} node={node} innerDecorations={innerDeco} />
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
