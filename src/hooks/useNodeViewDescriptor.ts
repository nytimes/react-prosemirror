import { Node } from "prosemirror-model";
import { MutableRefObject, useContext, useLayoutEffect } from "react";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { NodeViewContext } from "../contexts/NodeViewContext.js";
import { NodeViewDesc, ViewDesc } from "../descriptors/ViewDesc.js";
import { DecorationSourceInternal } from "../prosemirror-internal/DecorationInternal.js";

export function useNodeViewDescriptor(
  pos: number,
  node: Node,
  domRef: MutableRefObject<HTMLElement | null>,
  innerDecorations: DecorationSourceInternal
) {
  const { posToDesc, domToDesc } = useContext(NodeViewContext);
  const siblingDescriptors = useContext(ChildDescriptorsContext);
  const childDescriptors: ViewDesc[] = [];

  useLayoutEffect(() => {
    if (!domRef.current) return;

    const firstChildDesc = childDescriptors[0];

    const desc = new NodeViewDesc(
      undefined,
      childDescriptors,
      node,
      [],
      innerDecorations,
      domRef.current,
      firstChildDesc?.dom.parentElement ?? null,
      domRef.current ?? domRef.current,
      posToDesc,
      domToDesc
    );
    posToDesc.set(pos, desc);
    domToDesc.set(domRef.current, desc);
    siblingDescriptors.push(desc);

    for (const childDesc of childDescriptors) {
      childDesc.parent = desc;
    }
  });

  return childDescriptors;
}
