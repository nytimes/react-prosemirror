import { Node } from "prosemirror-model";
import React, {
  ForwardedRef,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { useChildNodeViews } from "../hooks/useChildNodeViews.js";
import { useNodeViewDescriptor } from "../hooks/useNodeViewDescriptor.js";
import { DecorationSourceInternal } from "../prosemirror-internal/DecorationInternal.js";

type Props = {
  node: Node;
  contentEditable: boolean;
  decorations: DecorationSourceInternal;
};

export const DocNodeView = forwardRef(function DocNodeView(
  { node, contentEditable, decorations, ...props }: Props,
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
    decorations,
    []
  );

  const children = useChildNodeViews(-1, node, decorations);

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
