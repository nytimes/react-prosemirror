import React, { useContext, useLayoutEffect, useRef } from "react";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { ReactWidgetDecoration } from "../decorations/ReactWidgetType.js";
import { WidgetViewDesc } from "../prosemirror-view/viewdesc.js";

type Props = {
  widget: ReactWidgetDecoration;
  pos: number;
};

export function WidgetView({ widget, pos }: Props) {
  const siblingDescriptors = useContext(ChildDescriptorsContext);
  const domRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!domRef.current) return;

    const desc = new WidgetViewDesc(undefined, widget, domRef.current);
    siblingDescriptors.push(desc);
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
