import { useContext } from "react";

import { useLayoutGroupEffect } from "../contexts/LayoutGroup.js";
import { NodeViewPositionsContext } from "../contexts/NodeViewPositionsContext.js";

export function useDomAtPos(
  pos: number,
  // TODO: Implement side affinity
  side = 0,
  effect: (dom: { node: Element | Text; offset: number }) => void
) {
  const { posToDOM } = useContext(NodeViewPositionsContext);
  useLayoutGroupEffect(() => {
    const nodePositions = Array.from(posToDOM.keys()).sort((a, b) => a - b);

    let foundNodePos = 0;
    for (const nodePos of nodePositions) {
      if (nodePos > pos) break;

      foundNodePos = pos;
    }

    const dom = posToDOM.get(foundNodePos);
    if (!dom) {
      throw new RangeError(`Could not find dom at position ${pos}`);
    }

    effect({ node: dom, offset: pos - foundNodePos });
  }, [effect, pos, posToDOM]);
}
