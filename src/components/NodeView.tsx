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
import { DecorationSourceInternal } from "../prosemirror-internal/DecorationInternal.js";

import { MarkView } from "./MarkView.js";
import { NodeViewComponentProps } from "./NodeViewComponentProps.js";
import { OutputSpec } from "./OutputSpec.js";
import { TextNodeView } from "./TextNodeView.js";
import { TrailingHackView } from "./TrailingHackView.js";

type Props = {
  node: Node;
  pos: number;
  decorations: DecorationSourceInternal;
};

export function NodeView({ node, pos, decorations }: Props) {
  const { posToDesc, domToDesc, nodeViews, state } =
    useContext(NodeViewContext);
  const siblingDescriptors = useContext(ChildDescriptorsContext);
  const childDescriptors: ViewDesc[] = [];
  const domRef = useRef<HTMLElement | null>(null);
  const nodeDomRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!domRef.current) return;

    const firstChildDesc = childDescriptors[0];

    const desc = new NodeViewDesc(
      undefined,
      node,
      [],
      DecorationSet.empty,
      domRef.current,
      firstChildDesc?.dom.parentElement ?? null,
      nodeDomRef.current ?? domRef.current,
      posToDesc,
      domToDesc
    );
    desc.children = childDescriptors;
    posToDesc.set(pos, desc);
    domToDesc.set(domRef.current, desc);
    siblingDescriptors.push(desc);

    for (const childDesc of childDescriptors) {
      childDesc.parent = desc;
    }
  });

  const content: ReactNode[] = [];
  const innerPos = pos + 1;
  node.content.forEach((childNode, offset) => {
    const childPos = innerPos + offset;
    if (childNode.isText) {
      content.push(
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
      content.push(
        <NodeView
          key={childPos}
          node={childNode}
          pos={childPos}
          decorations={decorations.forChild(offset, childNode)}
        />
      );
    }
  });

  if (!content.length) {
    content.push(<TrailingHackView key={innerPos} pos={innerPos} />);
  }

  const children = (
    <ChildDescriptorsContext.Provider value={childDescriptors}>
      {content}
    </ChildDescriptorsContext.Provider>
  );

  const Component:
    | ForwardRefExoticComponent<
        NodeViewComponentProps & RefAttributes<HTMLElement>
      >
    | undefined = nodeViews[node.type.name];

  if (Component) {
    return node.marks.reduce(
      (element, mark) => (
        <MarkView mark={mark} ref={nodeDomRef}>
          {element}
        </MarkView>
      ),
      <Component
        ref={domRef}
        node={node}
        pos={pos}
        decorations={[]}
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
    return node.marks.reduce(
      (element, mark) => (
        <MarkView ref={nodeDomRef} mark={mark}>
          {element}
        </MarkView>
      ),
      <OutputSpec ref={domRef} outputSpec={outputSpec}>
        {children}
      </OutputSpec>
    );
  }

  throw new Error(`Node spec for ${node.type.name} is missing toDOM`);
}
