import React, { useContext, useLayoutEffect, useRef } from "react";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { ReactWidgetDecoration } from "../decorations/ReactWidgetType.js";
import { WidgetViewDesc } from "../viewdesc.js";

type Props = {
  widget: ReactWidgetDecoration;
  pos: number;
};

export function WidgetView({ widget, pos }: Props) {
  const { siblingsRef, parentRef } = useContext(ChildDescriptorsContext);
  const viewDescRef = useRef<WidgetViewDesc | null>(null);

  const domRef = useRef<HTMLElement | null>(null);

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
    if (!domRef.current) return;

    if (!viewDescRef.current) {
      viewDescRef.current = new WidgetViewDesc(
        parentRef.current,
        widget,
        domRef.current
      );
    } else {
      viewDescRef.current.parent = parentRef.current;
      viewDescRef.current.widget = widget;
      viewDescRef.current.dom = domRef.current;
    }
    if (!siblingsRef.current.includes(viewDescRef.current)) {
      siblingsRef.current.push(viewDescRef.current);
    }
  });

  const { Component } = widget.type;

  return (
    Component && (
      <Component
        ref={domRef}
        widget={widget}
        pos={pos}
        contentEditable={false}
      />
    )
  );
}
