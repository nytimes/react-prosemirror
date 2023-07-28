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

import {
  NodeViewDescriptor,
  NodeViewDescriptorsContext,
} from "../contexts/NodeViewPositionsContext.js";

export function findChildDesc(
  pos: number,
  posToDesc: Map<number, NodeViewDescriptor>
) {
  const positions = Array.from(posToDesc.keys()).sort((a, b) => b - a);

  let parentPos = null;
  for (const nodePos of positions) {
    if (nodePos < pos) break;

    parentPos = nodePos;
  }

  return parentPos === null ? null : posToDesc.get(parentPos);
}

type NodeWrapperProps = {
  children: ReactNode;
  pos: number;
};
export function NodeWrapper({ children, pos }: NodeWrapperProps) {
  const { posToDesc, domToDesc } = useContext(NodeViewDescriptorsContext);
  const ref = useRef<Element | null>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;

    const childDesc = findChildDesc(pos, posToDesc);

    const desc: NodeViewDescriptor = {
      pos,
      dom: ref.current,
      contentDOM: childDesc?.dom.parentNode ?? null,
    };
    posToDesc.set(pos, desc);
    domToDesc.set(ref.current, desc);
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

  return <>{clonedChild}</>;
}
