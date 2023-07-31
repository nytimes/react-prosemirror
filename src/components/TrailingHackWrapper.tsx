import React, { useContext, useLayoutEffect, useRef } from "react";

import { NodeViewDescriptorsContext } from "../contexts/NodeViewPositionsContext.js";
import { TrailingHackViewDesc, ViewDesc } from "../descriptors/ViewDesc.js";

export function findChildDesc(pos: number, posToDesc: Map<number, ViewDesc>) {
  const positions = Array.from(posToDesc.keys()).sort((a, b) => b - a);

  let parentPos = null;
  for (const nodePos of positions) {
    if (nodePos < pos) break;

    parentPos = nodePos;
  }

  return parentPos === null ? null : posToDesc.get(parentPos);
}

type NodeWrapperProps = {
  pos: number;
};

export function TrailingHackWrapper({ pos }: NodeWrapperProps) {
  const { posToDesc, domToDesc } = useContext(NodeViewDescriptorsContext);
  const ref = useRef<HTMLBRElement | null>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;

    const desc = new TrailingHackViewDesc(
      undefined,
      [],
      ref.current,
      null,
      posToDesc,
      domToDesc
    );
    posToDesc.set(pos, desc);
    domToDesc.set(ref.current, desc);
  });

  return <br ref={ref} />;
}
