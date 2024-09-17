import { Node } from "prosemirror-model";
import { Decoration, DecorationSource } from "prosemirror-view";
import { MutableRefObject, useContext, useLayoutEffect, useRef } from "react";

import { ViewDescriptorContext } from "../contexts/ViewDescriptorContext.js";
import { NodeViewDesc, ViewDesc } from "../viewdesc.js";

import { useReactKeys } from "./useReactKeys.js";

export function useNodeViewDescriptor(
  node: Node | undefined,
  pos: number,
  domRef: undefined | MutableRefObject<HTMLElement | null>,
  nodeDomRef: MutableRefObject<HTMLElement | null>,
  innerDecorations: DecorationSource,
  outerDecorations: readonly Decoration[],
  viewDesc?: NodeViewDesc,
  contentDOMRef?: MutableRefObject<HTMLElement | null>
) {
  const nodeViewDescRef = useRef<NodeViewDesc | undefined>(viewDesc);
  const viewDescContext = useContext(ViewDescriptorContext);
  const reactKeysState = useReactKeys();
  const key = reactKeysState?.posToKey.get(pos);
  const childKeys = key && reactKeysState?.keyToChildren.get(key);
  const parentKey = key && reactKeysState?.keyToParent.get(key);

  useLayoutEffect(() => {
    if (!node || !nodeDomRef.current || !childKeys) return;

    const childDescriptors = childKeys
      .map((key) => viewDescContext[key])
      .filter((childDesc): childDesc is ViewDesc => !!childDesc);

    const parentDescriptor =
      parentKey !== undefined ? viewDescContext[parentKey] : undefined;

    const firstChildDesc = childDescriptors[0];

    if (!nodeViewDescRef.current) {
      nodeViewDescRef.current = new NodeViewDesc(
        undefined,
        childDescriptors,
        node,
        outerDecorations,
        innerDecorations,
        domRef?.current ?? nodeDomRef.current,
        firstChildDesc?.dom.parentElement ?? null,
        nodeDomRef.current
      );
    } else {
      nodeViewDescRef.current.parent = parentDescriptor;
      nodeViewDescRef.current.children = childDescriptors;
      nodeViewDescRef.current.node = node;
      nodeViewDescRef.current.outerDeco = outerDecorations;
      nodeViewDescRef.current.innerDeco = innerDecorations;
      nodeViewDescRef.current.dom = domRef?.current ?? nodeDomRef.current;
      // @ts-expect-error We have our own ViewDesc implementations
      nodeViewDescRef.current.dom.pmViewDesc = nodeViewDescRef.current;
      nodeViewDescRef.current.contentDOM =
        // If there's already a contentDOM, we can just
        // keep it; it won't have changed. This is especially
        // important during compositions, where the
        // firstChildDesc might not have a correct dom node set yet.
        contentDOMRef?.current ??
        nodeViewDescRef.current.contentDOM ??
        firstChildDesc?.dom.parentElement ??
        null;
      nodeViewDescRef.current.nodeDOM = nodeDomRef.current;
    }

    viewDescContext[key] = nodeViewDescRef.current;

    for (const childDesc of childDescriptors) {
      childDesc.parent = nodeViewDescRef.current;
    }
  });
}
