import React, {
  MutableRefObject,
  useContext,
  useLayoutEffect,
  useRef,
} from "react";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { TrailingHackViewDesc, sortViewDescs } from "../viewdesc.js";

type Props = {
  getPos: MutableRefObject<() => number>;
};

export function TrailingHackView({ getPos }: Props) {
  const { siblingsRef, parentRef } = useContext(ChildDescriptorsContext);
  const viewDescRef = useRef<TrailingHackViewDesc | null>(null);

  const ref = useRef<(HTMLBRElement & HTMLImageElement) | null>(null);

  useLayoutEffect(() => {
    const siblings = siblingsRef.current;
    return () => {
      if (!viewDescRef.current) return;
      if (siblings.includes(viewDescRef.current)) {
        const index = siblings.indexOf(viewDescRef.current);
        siblings.splice(index, 1);
      }
    };
  }, [siblingsRef]);

  useLayoutEffect(() => {
    if (!ref.current) return;

    if (!viewDescRef.current) {
      viewDescRef.current = new TrailingHackViewDesc(
        parentRef.current,
        [],
        () => getPos.current(),
        ref.current,
        null
      );
    } else {
      viewDescRef.current.parent = parentRef.current;
      viewDescRef.current.dom = ref.current;
      viewDescRef.current.getPos = () => getPos.current();
    }
    if (!siblingsRef.current.includes(viewDescRef.current)) {
      siblingsRef.current.push(viewDescRef.current);
    }
    siblingsRef.current.sort(sortViewDescs);
  });

  return <br ref={ref} className="ProseMirror-trailingBreak" />;
}
