import { DOMOutputSpec, Node } from "prosemirror-model";
import { NodeSelection } from "prosemirror-state";
import {
  Decoration,
  DecorationSource,
  NodeView as NodeViewT,
} from "prosemirror-view";
import React, {
  ForwardRefExoticComponent,
  RefAttributes,
  cloneElement,
  createElement,
  useContext,
  useLayoutEffect,
  useRef,
} from "react";
import { createPortal } from "react-dom";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { EditorContext } from "../contexts/EditorContext.js";
import { NodeViewContext } from "../contexts/NodeViewContext.js";
import { useEditorState } from "../hooks/useEditorState.js";
import { useNodeViewDescriptor } from "../hooks/useNodeViewDescriptor.js";

import { ChildNodeViews, wrapInDeco } from "./ChildNodeViews.js";
import { MarkView } from "./MarkView.js";
import { NodeViewComponentProps } from "./NodeViewComponentProps.js";
import { OutputSpec } from "./OutputSpec.js";

type NodeViewProps = {
  outerDeco: readonly Decoration[];
  pos: number;
  node: Node;
  innerDeco: DecorationSource;
};

export function NodeView({
  outerDeco,
  pos,
  node,
  innerDeco,
  ...props
}: NodeViewProps) {
  const domRef = useRef<HTMLElement | null>(null);
  const nodeDomRef = useRef<HTMLElement | null>(null);
  const contentDomRef = useRef<HTMLElement | null>(null);
  // this is ill-conceived; should revisit
  const initialNode = useRef(node);
  const initialOuterDeco = useRef(outerDeco);
  const initialInnerDeco = useRef(innerDeco);
  const posRef = useRef(pos);
  posRef.current = pos;
  const customNodeViewRootRef = useRef<HTMLDivElement | null>(null);
  const customNodeViewRef = useRef<NodeViewT | null>(null);

  const state = useEditorState();
  const { nodeViews } = useContext(NodeViewContext);
  const { view } = useContext(EditorContext);

  let element: JSX.Element | null = null;

  const Component:
    | ForwardRefExoticComponent<
        NodeViewComponentProps & RefAttributes<HTMLElement>
      >
    | undefined = nodeViews[node.type.name];

  // TODO: Would be great to pull all of the custom node view stuff into
  // a hook
  const customNodeView = view?.someProp("nodeViews")?.[node.type.name];

  useLayoutEffect(() => {
    if (!customNodeViewRef.current || !customNodeViewRootRef.current) return;

    const { dom } = customNodeViewRef.current;
    nodeDomRef.current = customNodeViewRootRef.current;
    customNodeViewRootRef.current.appendChild(dom);
    return () => {
      customNodeViewRef.current?.destroy?.();
    };
  }, []);

  useLayoutEffect(() => {
    if (!customNodeView || !customNodeViewRef.current) return;

    const { destroy, update } = customNodeViewRef.current;

    const updated = update?.(node, outerDeco, innerDeco) ?? true;
    if (updated) return;

    destroy?.();

    if (!customNodeView || !customNodeViewRootRef.current) return;

    initialNode.current = node;
    initialOuterDeco.current = outerDeco;
    initialInnerDeco.current = innerDeco;

    customNodeViewRef.current = customNodeView(
      initialNode.current,
      view,
      () => posRef.current,
      initialOuterDeco.current,
      initialInnerDeco.current
    );
    const { dom } = customNodeViewRef.current;
    nodeDomRef.current = customNodeViewRootRef.current;
    customNodeViewRootRef.current.appendChild(dom);
  }, [customNodeView, view, innerDeco, node, outerDeco]);

  const childDescriptors = useNodeViewDescriptor(
    node,
    domRef,
    nodeDomRef,
    innerDeco,
    outerDeco,
    undefined,
    contentDomRef
  );

  if (Component) {
    element = (
      <Component
        {...props}
        ref={nodeDomRef}
        nodeProps={{
          node: node,
          pos: pos,
          decorations: outerDeco,
          innerDecorations: innerDeco,
          isSelected:
            state?.selection instanceof NodeSelection &&
            state.selection.node === node,
        }}
      >
        <ChildNodeViews pos={pos} node={node} innerDecorations={innerDeco} />
      </Component>
    );
  } else if (customNodeView) {
    if (!customNodeViewRef.current) {
      customNodeViewRef.current = customNodeView(
        initialNode.current,
        view,
        () => posRef.current,
        initialOuterDeco.current,
        initialInnerDeco.current
      );
    }
    const { contentDOM } = customNodeViewRef.current;
    contentDomRef.current = contentDOM ?? null;
    element = createElement(
      node.isInline ? "span" : "div",
      {
        ref: customNodeViewRootRef,
        contentEditable: !!contentDOM,
        suppressContentEditableWarning: true,
      },
      contentDOM &&
        createPortal(
          <ChildNodeViews pos={pos} node={node} innerDecorations={innerDeco} />,
          contentDOM
        )
    );
  } else {
    const outputSpec: DOMOutputSpec | undefined = node.type.spec.toDOM?.(node);

    if (outputSpec) {
      element = (
        <OutputSpec {...props} ref={nodeDomRef} outputSpec={outputSpec}>
          <ChildNodeViews pos={pos} node={node} innerDecorations={innerDeco} />
        </OutputSpec>
      );
    }
  }

  if (!element) {
    throw new Error(`Node spec for ${node.type.name} is missing toDOM`);
  }

  const decoratedElement = cloneElement(
    outerDeco.reduce(wrapInDeco, element),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    outerDeco.some((d) => (d as any).type.attrs.nodeName)
      ? { ref: domRef }
      : // If all of the node decorations were attr-only, then
        // we've already passed the domRef to the NodeView component
        // as a prop
        undefined
  );

  // TODO: Should we only be wrapping non-inline elements? Inline elements have
  // already been wrapped in ChildNodeViews/InlineView?
  const markedElement = node.marks.reduce(
    (element, mark) => <MarkView mark={mark}>{element}</MarkView>,
    decoratedElement
  );

  return (
    <ChildDescriptorsContext.Provider value={childDescriptors}>
      {cloneElement(
        markedElement,
        node.marks.length ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          outerDeco.some((d) => (d as any).type.attrs.nodeName)
          ? { ref: domRef }
          : // If all of the node decorations were attr-only, then
            // we've already passed the domRef to the NodeView component
            // as a prop
            undefined
      )}
    </ChildDescriptorsContext.Provider>
  );
}
