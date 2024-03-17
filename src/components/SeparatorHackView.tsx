import React, { useContext, useLayoutEffect, useRef, useState } from "react";

import { browser } from "../browser.js";
import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { TrailingHackViewDesc } from "../viewdesc.js";

export function SeparatorHackView() {
  const siblingDescriptors = useContext(ChildDescriptorsContext);
  const ref = useRef<HTMLImageElement | null>(null);
  const [shouldRender, setShouldRender] = useState(false);

  // There's no risk of an infinite loop here, because
  // we call setShouldRender conditionally
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const lastSibling = siblingDescriptors[siblingDescriptors.length - 1];
    if (
      (browser.safari || browser.chrome) &&
      (lastSibling?.dom as HTMLElement)?.contentEditable == "false"
    ) {
      setShouldRender(true);
      return;
    }

    if (!ref.current) return;

    const desc = new TrailingHackViewDesc(undefined, [], ref.current, null);
    siblingDescriptors.push(desc);
  });

  return shouldRender ? (
    <img ref={ref} className="ProseMirror-separator" />
  ) : null;
}
