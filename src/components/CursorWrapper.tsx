import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { domIndex } from "../dom.js";
import { useEditorEffect } from "../hooks/useEditorEffect.js";

import { WidgetViewComponentProps } from "./WidgetViewComponentProps.js";

export const CursorWrapper = forwardRef<
  HTMLImageElement,
  WidgetViewComponentProps
>(function CursorWrapper({ widget, pos, ...props }, ref) {
  const [shouldRender, setShouldRender] = useState(true);
  const innerRef = useRef<HTMLImageElement | null>(null);

  useImperativeHandle<HTMLImageElement | null, HTMLImageElement | null>(
    ref,
    () => {
      return innerRef.current;
    },
    []
  );

  useEditorEffect((view) => {
    if (!view || !innerRef.current) return;

    // @ts-expect-error Internal property - domObserver
    view.domObserver.disconnectSelection();
    // @ts-expect-error Internal property - domSelection
    const domSel = view.domSelection();
    const range = document.createRange();
    const node = innerRef.current;
    const img = node.nodeName == "IMG";

    if (img && node.parentNode) {
      range.setEnd(node.parentNode, domIndex(node) + 1);
    } else {
      range.setEnd(node, 0);
    }

    range.collapse(false);
    domSel.removeAllRanges();
    domSel.addRange(range);

    setShouldRender(false);
    // @ts-expect-error Internal property - domObserver
    view.domObserver.connectSelection();
  }, []);

  return shouldRender ? (
    <img
      ref={innerRef}
      className="ProseMirror-separator"
      // eslint-disable-next-line react/no-unknown-property
      mark-placeholder="true"
      alt=""
      {...props}
    />
  ) : null;
});
