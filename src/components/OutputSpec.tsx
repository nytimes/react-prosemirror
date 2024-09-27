import { DOMOutputSpec } from "prosemirror-model";
import React, {
  HTMLProps,
  ReactNode,
  createElement,
  forwardRef,
  memo,
} from "react";

import { htmlAttrsToReactProps, mergeReactProps } from "../props.js";

type Props = HTMLProps<HTMLElement> & {
  outputSpec: DOMOutputSpec;
  children?: ReactNode;
};

export const OutputSpec = memo(
  forwardRef<HTMLElement, Props>(function OutputSpec(
    { outputSpec, children, ...propOverrides }: Props,
    ref
  ) {
    if (typeof outputSpec === "string") {
      return <>{outputSpec}</>;
    }

    if (!Array.isArray(outputSpec)) {
      throw new Error(
        "@nytimes/react-prosemirror only supports strings and arrays in toDOM"
      );
    }

    const tagSpec = outputSpec[0] as string;
    const tagName = tagSpec.replace(" ", ":");
    const attrs = outputSpec[1];

    let props: HTMLProps<HTMLElement> = {
      ref,
      ...propOverrides,
    };
    let start = 1;
    if (
      attrs &&
      typeof attrs === "object" &&
      attrs.nodeType == null &&
      !Array.isArray(attrs)
    ) {
      start = 2;
      props = mergeReactProps(htmlAttrsToReactProps(attrs), props);
    }

    const content: ReactNode[] = [];
    for (let i = start; i < outputSpec.length; i++) {
      const child = outputSpec[i] as DOMOutputSpec | 0;
      if (child === 0) {
        if (i < outputSpec.length - 1 || i > start) {
          throw new RangeError(
            "Content hole must be the only child of its parent node"
          );
        }
        return createElement(tagName, props, children);
      }
      content.push(
        <OutputSpec ref={undefined} outputSpec={child}>
          {children}
        </OutputSpec>
      );
    }
    return createElement(tagName, props, ...content);
  })
);
