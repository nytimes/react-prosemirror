import React, { useContext, useLayoutEffect, useRef } from "react";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { WidgetViewDesc } from "../descriptors/ViewDesc.js";
import { ReactWidgetDecoration } from "../prosemirror-internal/DecorationInternal.js";

type Props = {
  widget: ReactWidgetDecoration;
};

export function WidgetView({ widget }: Props) {
  const siblingDescriptors = useContext(ChildDescriptorsContext);
  const domRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!domRef.current) return;

    const desc = new WidgetViewDesc(undefined, widget, domRef.current);
    siblingDescriptors.push(desc);
  });

  const { Component } = widget.type;

  return <Component ref={domRef} contentEditable={false} />;
}
