import { Node } from "prosemirror-model";
import { MutableRefObject, useContext, useLayoutEffect } from "react";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { NodeViewContext } from "../contexts/NodeViewContext.js";
import { NodeViewDesc, ViewDesc } from "../descriptors/ViewDesc.js";
import {
  DecorationInternal,
  DecorationSourceInternal,
} from "../prosemirror-internal/DecorationInternal.js";

export function useNodeViewDescriptor(
  pos: number,
  node: Node,
  domRef: undefined | MutableRefObject<HTMLElement | null>,
  nodeDomRef: MutableRefObject<HTMLElement | null>,
  innerDecorations: DecorationSourceInternal,
  outerDecorations: readonly DecorationInternal[]
) {
  const { posToDesc, domToDesc } = useContext(NodeViewContext);
  const siblingDescriptors = useContext(ChildDescriptorsContext);
  const childDescriptors: ViewDesc[] = [];

  useLayoutEffect(() => {
    if (!nodeDomRef.current) return;

    const firstChildDesc = childDescriptors[0];

    const desc = new NodeViewDesc(
      undefined,
      childDescriptors,
      node,
      outerDecorations,
      innerDecorations,
      domRef?.current ?? nodeDomRef.current,
      firstChildDesc?.dom.parentElement ?? null,
      nodeDomRef.current,
      posToDesc,
      domToDesc
    );
    posToDesc.set(pos, desc);
    domToDesc.set(nodeDomRef.current, desc);
    siblingDescriptors.push(desc);

    for (const childDesc of childDescriptors) {
      childDesc.parent = desc;
    }
  });

  return childDescriptors;
}
