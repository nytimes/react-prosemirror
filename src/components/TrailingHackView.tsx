import React, { useContext, useLayoutEffect, useRef } from "react";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { NodeViewContext } from "../contexts/NodeViewContext.js";
import { TrailingHackViewDesc } from "../descriptors/ViewDesc.js";

type Props = {
  pos: number;
};

export function TrailingHackView({ pos }: Props) {
  const { posToDesc, domToDesc } = useContext(NodeViewContext);
  const siblingDescriptors = useContext(ChildDescriptorsContext);
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
    siblingDescriptors.push(desc);
  });

  return <br ref={ref} />;
}
