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

type NodeWrapperProps = {
  children: ReactNode;
  pos: number;
};
export function NodeWrapper({ children, pos }: NodeWrapperProps) {
  const { posToDesc: posToDOM, domToDesc: domToPos } = useContext(
    NodeViewDescriptorsContext
  );
  const ref = useRef<Element | null>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const desc: NodeViewDescriptor = {
      pos,
      dom: ref.current,
      contentDOM: null,
    };
    posToDOM.set(pos, desc);
    domToPos.set(ref.current, desc);
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
