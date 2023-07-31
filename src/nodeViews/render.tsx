import { DOMOutputSpec, Mark } from "prosemirror-model";
import { Decoration, DecorationAttrs } from "prosemirror-view";
import React, {
  ReactNode,
  cloneElement,
  createElement,
  isValidElement,
} from "react";

import { TrailingHackWrapper } from "../components/TrailingHackWrapper.js";

export function renderSpec(outputSpec: DOMOutputSpec, pos: number): ReactNode {
  if (typeof outputSpec === "string") {
    return outputSpec;
  }

  if (Array.isArray(outputSpec)) {
    const tagSpec = outputSpec[0] as string;
    const tagName = tagSpec.replace(" ", ":");
    const attrs = outputSpec[1];

    const props: Record<string, unknown> = {};
    let start = 1;
    if (
      attrs &&
      typeof attrs === "object" &&
      attrs.nodeType == null &&
      !Array.isArray(attrs)
    ) {
      start = 2;
      for (const name in attrs)
        if (attrs[name] != null) {
          const attrName = name.replace(" ", ":");
          props[attrName] = attrs[name];
        }
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
        return createElement(
          tagName,
          props,
          <TrailingHackWrapper pos={pos + 1} />
        );
      }
      content.push(renderSpec(child, pos));
    }
    return createElement(tagName, props, ...content);
  }

  throw new Error(
    "@nytimes/react-prosemirror only supports strings and arrays in toDOM"
  );
}

export function wrapInMarks(
  element: JSX.Element,
  marks: readonly Mark[],
  isInline: boolean
): JSX.Element {
  return marks.reduce((acc, mark) => {
    const outputSpec = mark.type.spec.toDOM?.(mark, isInline);
    if (!outputSpec)
      throw new Error(`Mark spec for ${mark.type.name} is missing toDOM`);

    // TODO: The position doesn't really matter here?
    const markElement = renderSpec(outputSpec, -1);
    if (!isValidElement(markElement)) {
      throw new Error("Don't yet support marks without holes");
    }

    return cloneElement(markElement, undefined, acc);
  }, element);
}

export function wrapInDecorations(
  element: JSX.Element,
  decorations: Decoration[],
  isInline: boolean
) {
  return decorations.reduce((acc, deco) => {
    const attrs = (deco as Decoration & { type: { attrs: DecorationAttrs } })
      .type.attrs;

    // TODO: figure out style prop
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { nodeName = "span", class: className, style, ...props } = attrs;

    if (isInline) {
      return createElement(nodeName, { className, ...props }, acc);
    }

    return cloneElement(acc, {
      className: `${className} ${acc.props.className ?? ""}`.trim(),
      ...props,
    });
  }, element);
}
