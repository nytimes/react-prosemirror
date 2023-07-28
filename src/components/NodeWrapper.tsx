import { Node } from "prosemirror-model";
import { DecorationSet } from "prosemirror-view";
import React, {
  Children,
  ReactElement,
  ReactNode,
  cloneElement,
  isValidElement,
  useContext,
  useLayoutEffect,
  useRef,
} from "react";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { NodeViewDescriptorsContext } from "../contexts/NodeViewPositionsContext.js";
import { NodeViewDesc, ViewDesc } from "../descriptors/ViewDesc.js";

export function findChildDesc(pos: number, posToDesc: Map<number, ViewDesc>) {
  const positions = Array.from(posToDesc.keys()).sort((a, b) => b - a);

  let parentPos = null;
  for (const nodePos of positions) {
    if (nodePos < pos) break;

    parentPos = nodePos;
  }

  return parentPos === null ? null : posToDesc.get(parentPos);
}

type NodeWrapperProps = {
  node: Node;
  children: ReactNode;
  pos: number;
};

export function NodeWrapper({ node, children, pos }: NodeWrapperProps) {
  const { posToDesc, domToDesc } = useContext(NodeViewDescriptorsContext);
  const siblingDescriptors = useContext(ChildDescriptorsContext);
  const childDescriptors: ViewDesc[] = [];
  const ref = useRef<Element | null>(null);

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

  const child = Children.only(children);
  if (!isValidElement(child)) return <>{child}</>;

  const childElement = child as ReactElement;
  const clonedChild = cloneElement(childElement, {
    ref: (element: Element) => {
      if ("ref" in childElement) {
        if (typeof childElement.ref === "function") {
          childElement.ref(element);
        } else if (
          typeof childElement.ref === "object" &&
          childElement.ref !== null &&
          "current" in childElement.ref
        ) {
          childElement.ref.current = element;
        }
      }
      ref.current = element;
    },
  });

  return (
    <ChildDescriptorsContext.Provider value={childDescriptors}>
      {clonedChild}
    </ChildDescriptorsContext.Provider>
  );
}
