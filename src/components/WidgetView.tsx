import React, {
  MutableRefObject,
  useContext,
  useLayoutEffect,
  useRef,
} from "react";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { ReactWidgetDecoration } from "../decorations/ReactWidgetType.js";
import { WidgetViewDesc } from "../viewdesc.js";

type Props = {
  widget: ReactWidgetDecoration;
  getPos: MutableRefObject<() => number>;
};

export function WidgetView({ widget, getPos }: Props) {
  const { siblingsRef, parentRef } = useContext(ChildDescriptorsContext);
  const viewDescRef = useRef<WidgetViewDesc | null>(null);
  const getPosFunc = useRef(() => getPos.current()).current;

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
        () => getPos.current(),
        widget,
        domRef.current
      );
    } else {
      viewDescRef.current.parent = parentRef.current;
      viewDescRef.current.widget = widget;
      viewDescRef.current.getPos = () => getPos.current();
      viewDescRef.current.dom = domRef.current;
    }
    if (!siblingsRef.current.includes(viewDescRef.current)) {
      siblingsRef.current.push(viewDescRef.current);
    }
    siblingsRef.current.sort((a, b) => a.getPos() - b.getPos());
  });

  const { Component } = widget.type;

  return (
    Component && (
      <Component
        ref={domRef}
        widget={widget}
        getPos={getPosFunc}
        contentEditable={false}
      />
    )
  );
}
