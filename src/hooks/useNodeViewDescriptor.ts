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
  const siblingDescriptors = useContext(ChildDescriptorsContext);
  const childDescriptors: ViewDesc[] = [];

  useLayoutEffect(() => {
    if (!node || !nodeDomRef.current) return;

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
        nodeDomRef.current,
        (event) => !!stopEvent.current(event)
      );
    } else {
      nodeViewDescRef.current.parent = undefined;
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
    setHasContentDOM(nodeViewDescRef.current.contentDOM !== null);
    siblingDescriptors.push(nodeViewDescRef.current);

    for (const childDesc of childDescriptors) {
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

  return { hasContentDOM, childDescriptors, setStopEvent };
}
