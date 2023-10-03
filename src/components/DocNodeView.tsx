// TODO: I must be missing something, but I do not know why
// this linting rule is only broken in this file
/* eslint-disable react/prop-types */
import { Node } from "prosemirror-model";
import React, {
  ForwardedRef,
  ReactElement,
  cloneElement,
  createElement,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { useNodeViewDescriptor } from "../hooks/useNodeViewDescriptor.js";
import {
  Decoration,
  DecorationSource,
} from "../prosemirror-view/decoration.js";

import { ChildNodeViews, wrapInDeco } from "./ChildNodeViews.js";

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

  const props = {
    ref: innerRef,
    className,
    suppressContentEditableWarning: true,
  };

  const element = as
    ? cloneElement(
        as,
        props,
        <ChildDescriptorsContext.Provider value={childDescriptors}>
          <ChildNodeViews pos={-1} node={node} innerDecorations={innerDeco} />
        </ChildDescriptorsContext.Provider>
      )
    : createElement(
        "div",
        props,
        <ChildDescriptorsContext.Provider value={childDescriptors}>
          <ChildNodeViews pos={-1} node={node} innerDecorations={innerDeco} />
        </ChildDescriptorsContext.Provider>
      );

  if (!node) return element;

  const nodeDecorations = outerDeco.filter((deco) => !deco.inline);
  if (!nodeDecorations.length) {
    return element;
  }

  const wrapped = nodeDecorations.reduce(wrapInDeco, element);
  return wrapped;
});
