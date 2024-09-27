import { Node } from "prosemirror-model";
import { Decoration, DecorationSource } from "prosemirror-view";
import {
  MutableRefObject,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { EditorContext } from "../contexts/EditorContext.js";
import { CompositionViewDesc, NodeViewDesc, ViewDesc } from "../viewdesc.js";

export function useNodeViewDescriptor(
  node: Node | undefined,
  domRef: undefined | MutableRefObject<HTMLElement | null>,
  nodeDomRef: MutableRefObject<HTMLElement | null>,
  innerDecorations: DecorationSource,
  outerDecorations: readonly Decoration[],
  viewDesc?: NodeViewDesc,
  contentDOMRef?: MutableRefObject<HTMLElement | null>
) {
  const { view } = useContext(EditorContext);
  const [hasContentDOM, setHasContentDOM] = useState(true);
  const nodeViewDescRef = useRef<NodeViewDesc | undefined>(viewDesc);
  const stopEvent = useRef<(event: Event) => boolean | undefined>(() => false);
  const setStopEvent = useCallback(
    (newStopEvent: (event: Event) => boolean | undefined) => {
      stopEvent.current = newStopEvent;
    },
    []
  );
  const { siblingsRef, parentRef } = useContext(ChildDescriptorsContext);
  const childDescriptors = useRef<ViewDesc[]>([]);

  useLayoutEffect(() => {
    const siblings = siblingsRef.current;
    return () => {
      if (!nodeViewDescRef.current) return;
      if (siblings.includes(nodeViewDescRef.current)) {
        const index = siblings.indexOf(nodeViewDescRef.current);
        siblings.splice(index, 1);
      }
    };
  }, [siblingsRef]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (!node || !nodeDomRef.current) return;

    const firstChildDesc = childDescriptors.current[0];

    if (!nodeViewDescRef.current) {
      nodeViewDescRef.current = new NodeViewDesc(
        parentRef.current,
        childDescriptors.current,
        node,
        outerDecorations,
        innerDecorations,
        domRef?.current ?? nodeDomRef.current,
        firstChildDesc?.dom.parentElement ?? null,
        nodeDomRef.current,
        (event) => !!stopEvent.current(event)
      );
    } else {
      nodeViewDescRef.current.parent = parentRef.current;
      nodeViewDescRef.current.children = childDescriptors.current;
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
    setHasContentDOM(nodeViewDescRef.current.contentDOM !== null);

    if (!siblingsRef.current.includes(nodeViewDescRef.current)) {
      siblingsRef.current.push(nodeViewDescRef.current);
    }

    for (const childDesc of childDescriptors.current) {
      childDesc.parent = nodeViewDescRef.current;

      // Because TextNodeViews can't locate the DOM nodes
      // for compositions, we need to override them here
      if (childDesc instanceof CompositionViewDesc) {
        const compositionTopDOM =
          nodeViewDescRef.current.contentDOM?.firstChild;
        if (!compositionTopDOM)
          throw new Error(
            `Started a composition but couldn't find the text node it belongs to.`
          );

        let textDOM = compositionTopDOM;
        while (textDOM.firstChild) {
          textDOM = textDOM.firstChild as Element | Text;
        }

        if (!textDOM || !(textDOM instanceof Text))
          throw new Error(
            `Started a composition but couldn't find the text node it belongs to.`
          );

        childDesc.dom = compositionTopDOM;
        childDesc.textDOM = textDOM;
        childDesc.text = textDOM.data;
        // @ts-expect-error ???
        childDesc.textDOM.pmViewDesc = childDesc;

        // @ts-expect-error ???
        view?.input.compositionNodes.push(childDesc);
      }
    }

    return () => {
      if (
        nodeViewDescRef.current?.children[0] instanceof CompositionViewDesc &&
        !view?.composing
      ) {
        nodeViewDescRef.current?.children[0].dom.parentNode?.removeChild(
          nodeViewDescRef.current?.children[0].dom
        );
      }
    };
  });

  return { hasContentDOM, childDescriptors, nodeViewDescRef, setStopEvent };
}
