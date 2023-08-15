import { Node } from "prosemirror-model";
import React, {
  ForwardedRef,
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
  contentEditable: boolean;
  innerDeco: DecorationSource;
  outerDeco: Decoration[];
};

export const DocNodeView = forwardRef(function DocNodeView(
  { node, contentEditable, innerDeco, outerDeco, ...props }: Props,
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

  const element = (
    <div ref={innerRef} suppressContentEditableWarning={true} {...props}>
      <ChildDescriptorsContext.Provider value={childDescriptors}>
        {children}
      </ChildDescriptorsContext.Provider>
    </div>
  );

  const nodeDecorations = outerDeco.filter((deco) => !deco.inline);
  if (!nodeDecorations.length) {
    return element;
  }

  return nodeDecorations.reduce(wrapInDeco, element);
});
