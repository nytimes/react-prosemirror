import React, { useContext, useLayoutEffect, useRef } from "react";

import { NodeViewContext } from "../contexts/NodeViewContext.js";
import { TrailingHackViewDesc } from "../descriptors/ViewDesc.js";

type Props = {
  pos: number;
};

export function TrailingHackView({ pos }: Props) {
  const { posToDesc, domToDesc } = useContext(NodeViewContext);
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
