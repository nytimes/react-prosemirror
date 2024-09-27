import React, { useContext, useLayoutEffect, useRef, useState } from "react";

import { browser } from "../browser.js";
import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { TrailingHackViewDesc } from "../viewdesc.js";

type Props = {
  pos: number;
};

export function SeparatorHackView({ pos }: Props) {
  const { siblingsRef, parentRef } = useContext(ChildDescriptorsContext);
  const viewDescRef = useRef<TrailingHackViewDesc | null>(null);
  const ref = useRef<HTMLImageElement | null>(null);
  const [shouldRender, setShouldRender] = useState(false);

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

  // There's no risk of an infinite loop here, because
  // we call setShouldRender conditionally
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const lastSibling = siblingsRef.current[siblingsRef.current.length - 1];
    if (
      (browser.safari || browser.chrome) &&
      (lastSibling?.dom as HTMLElement)?.contentEditable == "false"
    ) {
      setShouldRender(true);
      return;
    }

    if (!ref.current) return;

    if (!viewDescRef.current) {
      viewDescRef.current = new TrailingHackViewDesc(
        parentRef.current,
        [],
        pos,
        ref.current,
        null
      );
    } else {
      viewDescRef.current.parent = parentRef.current;
      viewDescRef.current.dom = ref.current;
      viewDescRef.current.pos = pos;
    }
    if (!siblingsRef.current.includes(viewDescRef.current)) {
      siblingsRef.current.push(viewDescRef.current);
    }
  });

  return shouldRender ? (
    <img ref={ref} className="ProseMirror-separator" />
  ) : null;
}
