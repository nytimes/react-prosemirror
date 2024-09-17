// TODO: I must be missing something, but I do not know why
// this linting rule is only broken in this file
/* eslint-disable react/prop-types */
import { Node } from "prosemirror-model";
import { Decoration, DecorationSource } from "prosemirror-view";
import React, {
  DetailedHTMLProps,
  ForwardedRef,
  HTMLAttributes,
  ReactElement,
  cloneElement,
  createElement,
  forwardRef,
  memo,
  useImperativeHandle,
  useRef,
} from "react";

import { useNodeViewDescriptor } from "../hooks/useNodeViewDescriptor.js";
import { NodeViewDesc } from "../viewdesc.js";

import { ChildNodeViews, wrapInDeco } from "./ChildNodeViews.js";

export type DocNodeViewProps = {
  className?: string;
  node: Node | undefined;
  innerDeco: DecorationSource;
  outerDeco: Decoration[];
  as?: ReactElement;
  viewDesc?: NodeViewDesc;
} & Omit<DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLDivElement>, "ref">;

export const DocNodeView = memo(
  forwardRef(function DocNodeView(
    {
      className,
      node,
      innerDeco,
      outerDeco,
      as,
      viewDesc,
      ...elementProps
    }: DocNodeViewProps,
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

    useNodeViewDescriptor(
      node,
      -1,
      innerRef,
      innerRef,
      innerDeco,
      outerDeco,
      viewDesc
    );

    const props = {
      ...elementProps,
      ref: innerRef,
      className,
      suppressContentEditableWarning: true,
    };

    const element = as
      ? cloneElement(
          as,
          props,
          <ChildNodeViews pos={-1} node={node} innerDecorations={innerDeco} />
        )
      : createElement(
          "div",
          props,
          <ChildNodeViews pos={-1} node={node} innerDecorations={innerDeco} />
        );

    if (!node) return element;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodeDecorations = outerDeco.filter((deco) => !(deco as any).inline);
    if (!nodeDecorations.length) {
      return element;
    }

    const wrapped = nodeDecorations.reduce(wrapInDeco, element);
    return wrapped;
  })
);
