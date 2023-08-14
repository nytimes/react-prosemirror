import { Node } from "prosemirror-model";
import { MutableRefObject, useContext, useLayoutEffect } from "react";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import {
  Decoration,
  DecorationSource,
} from "../prosemirror-view/decoration.js";
import { NodeViewDesc, ViewDesc } from "../prosemirror-view/viewdesc.js";

export function useNodeViewDescriptor(
  node: Node,
  domRef: undefined | MutableRefObject<HTMLElement | null>,
  nodeDomRef: MutableRefObject<HTMLElement | null>,
  innerDecorations: DecorationSource,
  outerDecorations: readonly Decoration[]
) {
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
      nodeDomRef.current
    );
    siblingDescriptors.push(desc);

    for (const childDesc of childDescriptors) {
      childDesc.parent = desc;
    }
  });

  return childDescriptors;
}
