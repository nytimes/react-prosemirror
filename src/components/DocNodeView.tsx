import { Node } from "prosemirror-model";
import { DecorationSet } from "prosemirror-view";
import React, {
  DetailedHTMLProps,
  ForwardedRef,
  HTMLAttributes,
  ReactNode,
  forwardRef,
  useContext,
  useLayoutEffect,
  useRef,
} from "react";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { NodeViewContext } from "../contexts/NodeViewContext.js";
import { NodeViewDesc, ViewDesc } from "../descriptors/ViewDesc.js";

import { NodeView } from "./NodeView.js";

type Props = {
  node: Node;
  contentEditable: boolean;
} & DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;

export const DocNodeView = forwardRef(function DocNodeView(
  { node, contentEditable, ...props }: Props,
  ref: ForwardedRef<HTMLDivElement>
) {
  const { posToDesc, domToDesc } = useContext(NodeViewContext);
  const siblingDescriptors = useContext(ChildDescriptorsContext);
  const childDescriptors: ViewDesc[] = [];
  const innerRef = useRef<Element | null>(null);

  useLayoutEffect(() => {
    if (!innerRef.current) return;

    const firstChildDesc = childDescriptors[0];

    const desc = new NodeViewDesc(
      undefined,
      node,
      [],
      DecorationSet.empty,
      innerRef.current,
      firstChildDesc?.dom.parentElement ?? null,
      innerRef.current,
      posToDesc,
      domToDesc
    );
    desc.children = childDescriptors;
    posToDesc.set(-1, desc);
    domToDesc.set(innerRef.current, desc);
    siblingDescriptors.push(desc);

    for (const childDesc of childDescriptors) {
      childDesc.parent = desc;
    }
  });

  const children: ReactNode[] = [];
  const innerPos = 0;
  node.content.forEach((childNode, offset) => {
    const childPos = innerPos + offset;
    children.push(<NodeView key={childPos} node={childNode} pos={childPos} />);
  });

  return (
    <div
      ref={(element) => {
        innerRef.current = element;
        if (typeof ref === "function") {
          ref(element);
        } else if (ref) {
          ref.current = element;
        }
      }}
      contentEditable={contentEditable}
      suppressContentEditableWarning={true}
      {...props}
    >
      <ChildDescriptorsContext.Provider value={childDescriptors}>
        {children}
      </ChildDescriptorsContext.Provider>
    </div>
  );
});
