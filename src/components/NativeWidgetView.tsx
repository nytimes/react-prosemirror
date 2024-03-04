import { Decoration } from "prosemirror-view";
import React, { useContext, useLayoutEffect, useRef } from "react";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { useEditorEffect } from "../hooks/useEditorEffect.js";
import { WidgetViewDesc } from "../viewdesc.js";

type Props = {
  widget: Decoration;
  pos: number;
};

export function NativeWidgetView({ widget, pos }: Props) {
  const siblingDescriptors = useContext(ChildDescriptorsContext);
  const rootDomRef = useRef<HTMLDivElement | null>(null);
  const posRef = useRef(pos);
  posRef.current = pos;

  useEditorEffect((view) => {
    if (!rootDomRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dom = (widget as any).type.toDOM;
    if (typeof dom === "function") {
      dom = dom(view, () => {
        posRef.current;
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(widget as any).type.spec.raw) {
      if (dom.nodeType != 1) {
        const wrap = document.createElement("span");
        wrap.appendChild(dom);
        dom = wrap;
      }
      dom.contentEditable = "false";
      dom.classList.add("ProseMirror-widget");
    }
    if (rootDomRef.current.firstElementChild === dom) return;

    rootDomRef.current.replaceChildren(dom);
  });

  useLayoutEffect(() => {
    if (!rootDomRef.current) return;

    const desc = new WidgetViewDesc(undefined, widget, rootDomRef.current);
    siblingDescriptors.push(desc);
  });

  return <div ref={rootDomRef} />;
}
