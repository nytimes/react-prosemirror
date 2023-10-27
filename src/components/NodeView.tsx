import { DOMOutputSpec, Node } from "prosemirror-model";
import { NodeSelection } from "prosemirror-state";
import React, {
  ForwardRefExoticComponent,
  RefAttributes,
  cloneElement,
  useContext,
  useLayoutEffect,
  useRef,
} from "react";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { EditorContext } from "../contexts/EditorContext.js";
import { NodeViewContext } from "../contexts/NodeViewContext.js";
import { NonWidgetType } from "../decorations/ReactWidgetType.js";
import { useEditorState } from "../hooks/useEditorState.js";
import { useNodeViewDescriptor } from "../hooks/useNodeViewDescriptor.js";
import {
  Decoration,
  DecorationSource,
  NodeView as NodeViewT,
} from "../prosemirror-view/index.js";

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
  const { editorView } = useContext(EditorContext);

  let element: JSX.Element | null = null;

  const Component:
    | ForwardRefExoticComponent<
        NodeViewComponentProps & RefAttributes<HTMLElement>
      >
    | undefined = nodeViews[node.type.name];

  const customNodeView = editorView?.someProp("nodeViews")?.[node.type.name];

  useLayoutEffect(() => {
    if (!customNodeView || !customNodeViewRootRef.current) return;

    customNodeViewRef.current = customNodeView(
      initialNode.current,
      editorView,
      () => posRef.current,
      initialOuterDeco.current,
      initialInnerDeco.current
    );
    const { dom } = customNodeViewRef.current;
    nodeDomRef.current = customNodeViewRootRef.current;
    customNodeViewRootRef.current.appendChild(dom);
    return () => {
      customNodeViewRef.current?.destroy?.();
    };
  }, [customNodeView, editorView]);

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
      editorView,
      () => posRef.current,
      initialOuterDeco.current,
      initialInnerDeco.current
    );
    const { dom } = customNodeViewRef.current;
    nodeDomRef.current = customNodeViewRootRef.current;
    customNodeViewRootRef.current.appendChild(dom);
  }, [customNodeView, editorView, innerDeco, node, outerDeco]);

  const childDescriptors = useNodeViewDescriptor(
    node,
    domRef,
    nodeDomRef,
    innerDeco,
    outerDeco
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
    element = (
      <div
        ref={customNodeViewRootRef}
        style={{ display: "contents" }}
        contentEditable={false}
      />
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
    outerDeco.some((d) => (d.type as unknown as NonWidgetType).attrs.nodeName)
      ? { ref: domRef }
      : // If all of the node decorations were attr-only, then
        // we've already passed the domRef to the NodeView component
        // as a prop
        undefined
  );

  const markedElement = node.marks.reduce(
    (element, mark) => <MarkView mark={mark}>{element}</MarkView>,
    decoratedElement
  );

  return (
    <ChildDescriptorsContext.Provider value={childDescriptors}>
      {cloneElement(
        markedElement,
        node.marks.length ||
          outerDeco.some(
            (d) => (d.type as unknown as NonWidgetType).attrs.nodeName
          )
          ? { ref: domRef }
          : // If all of the node decorations were attr-only, then
            // we've already passed the domRef to the NodeView component
            // as a prop
            undefined
      )}
    </ChildDescriptorsContext.Provider>
  );
}
