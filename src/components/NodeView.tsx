import { DOMOutputSpec, Node } from "prosemirror-model";
import { NodeSelection } from "prosemirror-state";
import { DecorationSet } from "prosemirror-view";
import React, {
  ForwardRefExoticComponent,
  ReactNode,
  RefAttributes,
  useContext,
  useLayoutEffect,
  useRef,
} from "react";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { NodeViewContext } from "../contexts/NodeViewContext.js";
import { NodeViewDesc, ViewDesc } from "../descriptors/ViewDesc.js";

import { NodeViewComponentProps } from "./NodeViewComponentProps.js";
import { OutputSpec } from "./OutputSpec.js";
import { TextNodeView } from "./TextNodeView.js";
import { TrailingHackView } from "./TrailingHackView.js";

type Props = {
  node: Node;
  pos: number;
};

export function NodeView({ node, pos }: Props) {
  const { posToDesc, domToDesc, nodeViews, state } =
    useContext(NodeViewContext);
  const siblingDescriptors = useContext(ChildDescriptorsContext);
  const childDescriptors: ViewDesc[] = [];
  const ref = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;

    const firstChildDesc = childDescriptors[0];

    const desc = new NodeViewDesc(
      undefined,
      node,
      [],
      DecorationSet.empty,
      ref.current,
      firstChildDesc?.dom.parentElement ?? null,
      ref.current,
      posToDesc,
      domToDesc
    );
    desc.children = childDescriptors;
    posToDesc.set(pos, desc);
    domToDesc.set(ref.current, desc);
    siblingDescriptors.push(desc);

    for (const childDesc of childDescriptors) {
      childDesc.parent = desc;
    }
  });

  const children: ReactNode[] = [];
  const innerPos = pos + 1;
  node.content.forEach((childNode, offset) => {
    const childPos = innerPos + offset;
    if (childNode.isText) {
      children.push(
        <ChildDescriptorsContext.Consumer key={childPos}>
          {(siblingDescriptors) => (
            <TextNodeView
              node={childNode}
              pos={childPos}
              siblingDescriptors={siblingDescriptors}
            />
          )}
        </ChildDescriptorsContext.Consumer>
      );
    } else {
      children.push(
        <NodeView key={childPos} node={childNode} pos={childPos} />
      );
    }
  });

  if (!children.length) {
    children.push(<TrailingHackView pos={innerPos} />);
  }

  const Component:
    | ForwardRefExoticComponent<
        NodeViewComponentProps & RefAttributes<HTMLElement>
      >
    | undefined = nodeViews[node.type.name];

  if (Component) {
    return (
      <Component
        ref={ref}
        node={node}
        pos={pos}
        decorations={[]}
        isSelected={
          state.selection instanceof NodeSelection &&
          state.selection.node === node
        }
      >
        <ChildDescriptorsContext.Provider value={childDescriptors}>
          {children}
        </ChildDescriptorsContext.Provider>
      </Component>
    );
  }

  const outputSpec: DOMOutputSpec | undefined = node.type.spec.toDOM?.(node);

  if (outputSpec) {
    return (
      <OutputSpec ref={ref} outputSpec={outputSpec}>
        <ChildDescriptorsContext.Provider value={childDescriptors}>
          {children}
        </ChildDescriptorsContext.Provider>
      </OutputSpec>
    );
  }

  throw new Error(`Node spec for ${node.type.name} is missing toDOM`);
}
