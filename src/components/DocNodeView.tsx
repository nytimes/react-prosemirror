/* eslint-disable react/prop-types */
import { Node } from "prosemirror-model";
import React, {
  ForwardedRef,
  ReactElement,
  cloneElement,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { useChildNodeViews, wrapInDeco } from "../hooks/useChildNodeViews.js";
import { useNodeViewDescriptor } from "../hooks/useNodeViewDescriptor.js";
import {
  Decoration,
  DecorationSource,
} from "../prosemirror-view/decoration.js";

type Props = {
  className?: string;
  node: Node | undefined;
  innerDeco: DecorationSource;
  outerDeco: Decoration[];
  as?: ReactElement;
};

export const DocNodeView = forwardRef(function DocNodeView(
  { className, node, innerDeco, outerDeco, as }: Props,
  ref: ForwardedRef<HTMLDivElement | null>
) {
  const innerRef = useRef<HTMLDivElement | null>(null);

  useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(
    ref,
    () => {
      return innerRef.current;
    },
    []
  );

  const childDescriptors = useNodeViewDescriptor(
    node,
    innerRef,
    innerRef,
    innerDeco,
    outerDeco
  );

  const children = useChildNodeViews(-1, node, innerDeco);

  const element = as ? (
    cloneElement(
      as,
      { ref: innerRef, className, suppressContentEditableWarning: true },
      <ChildDescriptorsContext.Provider value={childDescriptors}>
        {children}
      </ChildDescriptorsContext.Provider>
    )
  ) : (
    <div
      ref={innerRef}
      className={className}
      suppressContentEditableWarning={true}
    >
      <ChildDescriptorsContext.Provider value={childDescriptors}>
        {children}
      </ChildDescriptorsContext.Provider>
    </div>
  );

  if (!node) return element;

  const nodeDecorations = outerDeco.filter((deco) => !deco.inline);
  if (!nodeDecorations.length) {
    return element;
  }

  const wrapped = nodeDecorations.reduce(wrapInDeco, element);
  return wrapped;
});
