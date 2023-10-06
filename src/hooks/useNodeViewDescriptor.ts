import { Node } from "prosemirror-model";
import { MutableRefObject, useContext, useLayoutEffect, useRef } from "react";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { EditorContext } from "../contexts/EditorContext.js";
import {
  Decoration,
  DecorationSource,
} from "../prosemirror-view/decoration.js";
import {
  CompositionViewDesc,
  NodeViewDesc,
  TrailingHackViewDesc,
  ViewDesc,
} from "../prosemirror-view/viewdesc.js";

export function useNodeViewDescriptor(
  node: Node | undefined,
  domRef: undefined | MutableRefObject<HTMLElement | null>,
  nodeDomRef: MutableRefObject<HTMLElement | null>,
  innerDecorations: DecorationSource,
  outerDecorations: readonly Decoration[],
  viewDesc?: NodeViewDesc
) {
  const { editorView } = useContext(EditorContext);
  const nodeViewDescRef = useRef<NodeViewDesc | undefined>(viewDesc);
  const siblingDescriptors = useContext(ChildDescriptorsContext);
  const childDescriptors: ViewDesc[] = [];

  useLayoutEffect(() => {
    if (!node || !nodeDomRef.current) return;

    const firstChildDesc = childDescriptors[0];

    const [prevFirstChildDesc] = nodeViewDescRef.current?.children ?? [];
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
      // @ts-expect-error ???
      nodeViewDescRef.current.dom.pmViewDesc = nodeViewDescRef.current;
      nodeViewDescRef.current.contentDOM =
        // THIS IS NOT A SAFE WAY TO GET THE CONTENT DOM
        nodeViewDescRef.current.dom;
      // firstChildDesc?.dom.parentElement ?? null;
      nodeViewDescRef.current.nodeDOM = nodeDomRef.current;
    }
    siblingDescriptors.push(nodeViewDescRef.current);

    for (const childDesc of childDescriptors) {
      childDesc.parent = nodeViewDescRef.current;
    }

    if (
      node.isTextblock &&
      (prevFirstChildDesc instanceof TrailingHackViewDesc ||
        prevFirstChildDesc instanceof CompositionViewDesc) &&
      editorView?.composing &&
      nodeViewDescRef.current.dom
    ) {
      const textDom = nodeViewDescRef.current.dom.firstChild;
      nodeViewDescRef.current.children = [
        new CompositionViewDesc(
          nodeViewDescRef.current,
          textDom!,
          textDom,
          textDom?.textContent
        ),
      ];
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
