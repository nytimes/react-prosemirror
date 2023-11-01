import { Node } from "prosemirror-model";
import { Decoration, DecorationSource } from "prosemirror-view";
import { MutableRefObject, useContext, useLayoutEffect, useRef } from "react";

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
  const { editorView } = useContext(EditorContext);
  const nodeViewDescRef = useRef<NodeViewDesc | undefined>(viewDesc);
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
        nodeDomRef.current
      );
    } else {
      nodeViewDescRef.current.parent = undefined;
      nodeViewDescRef.current.children = childDescriptors;
      nodeViewDescRef.current.node = node;
      nodeViewDescRef.current.outerDeco = outerDecorations;
      nodeViewDescRef.current.innerDeco = innerDecorations;
      nodeViewDescRef.current.dom = domRef?.current ?? nodeDomRef.current;
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
        childDesc.textDOM.pmViewDesc = childDesc;

        editorView?.input.compositionNodes.push(childDesc);
      }
    }

    return () => {
      if (
        nodeViewDescRef.current?.children[0] instanceof CompositionViewDesc &&
        !editorView?.composing
      ) {
        nodeViewDescRef.current?.children[0].dom.parentNode?.removeChild(
          nodeViewDescRef.current?.children[0].dom
        );
      }
    };
  });

  return childDescriptors;
}
