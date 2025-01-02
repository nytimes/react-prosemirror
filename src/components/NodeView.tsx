import { DOMOutputSpec, Node } from "prosemirror-model";
import {
  Decoration,
  DecorationSource,
  NodeView as NodeViewT,
} from "prosemirror-view";
import React, {
  ForwardRefExoticComponent,
  MutableRefObject,
  RefAttributes,
  cloneElement,
  memo,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { EditorContext } from "../contexts/EditorContext.js";
import { NodeViewContext } from "../contexts/NodeViewContext.js";
import { SelectNodeContext } from "../contexts/SelectNodeContext.js";
import { StopEventContext } from "../contexts/StopEventContext.js";
import { useNodeViewDescriptor } from "../hooks/useNodeViewDescriptor.js";

import { ChildNodeViews, wrapInDeco } from "./ChildNodeViews.js";
import { CustomNodeView } from "./CustomNodeView.js";
import { MarkView } from "./MarkView.js";
import { NodeViewComponentProps } from "./NodeViewComponentProps.js";
import { OutputSpec } from "./OutputSpec.js";

type NodeViewProps = {
  outerDeco: readonly Decoration[];
  getPos: MutableRefObject<() => number>;
  node: Node;
  innerDeco: DecorationSource;
};

export const NodeView = memo(function NodeView({
  outerDeco,
  getPos,
  node,
  innerDeco,
  ...props
}: NodeViewProps) {
  const domRef = useRef<HTMLElement | null>(null);
  const nodeDomRef = useRef<HTMLElement | null>(null);
  const contentDomRef = useRef<HTMLElement | null>(null);
  const getPosFunc = useRef(() => getPos.current()).current;
  // this is ill-conceived; should revisit
  const initialNode = useRef(node);
  const initialOuterDeco = useRef(outerDeco);
  const initialInnerDeco = useRef(innerDeco);
  const customNodeViewRootRef = useRef<HTMLDivElement | null>(null);
  const customNodeViewRef = useRef<NodeViewT | null>(null);

  // const state = useEditorState();
  const { nodeViews } = useContext(NodeViewContext);
  const { view } = useContext(EditorContext);

  let element: JSX.Element | null = null;

  const Component:
    | ForwardRefExoticComponent<
        NodeViewComponentProps & RefAttributes<HTMLElement>
      >
    | undefined = nodeViews[node.type.name];

  const outputSpec: DOMOutputSpec | undefined = useMemo(
    () => node.type.spec.toDOM?.(node),
    [node]
  );

  // TODO: Would be great to pull all of the custom node view stuff into
  // a hook
  const customNodeView = view?.someProp(
    "nodeViews",
    (nodeViews) => nodeViews?.[node.type.name]
  );

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

    const updated =
      update?.call(customNodeViewRef.current, node, outerDeco, innerDeco) ??
      true;
    if (updated) return;

    destroy?.call(customNodeViewRef.current);

    if (!customNodeViewRootRef.current) return;

    initialNode.current = node;
    initialOuterDeco.current = outerDeco;
    initialInnerDeco.current = innerDeco;

    customNodeViewRef.current = customNodeView(
      initialNode.current,
      // customNodeView will only be set if view is set, and we can only reach
      // this line if customNodeView is set
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      view!,
      () => getPos.current(),
      initialOuterDeco.current,
      initialInnerDeco.current
    );
    const { dom } = customNodeViewRef.current;
    nodeDomRef.current = customNodeViewRootRef.current;
    customNodeViewRootRef.current.appendChild(dom);
  }, [customNodeView, view, innerDeco, node, outerDeco, getPos]);

  const {
    hasContentDOM,
    childDescriptors,
    setStopEvent,
    setSelectNode,
    nodeViewDescRef,
  } = useNodeViewDescriptor(
    node,
    () => getPos.current(),
    domRef,
    nodeDomRef,
    innerDeco,
    outerDeco,
    undefined,
    contentDomRef
  );

  const finalProps = {
    ...props,
    ...(!hasContentDOM && {
      contentEditable: false,
    }),
  };

  const nodeProps = useMemo(
    () => ({
      node: node,
      getPos: getPosFunc,
      decorations: outerDeco,
      innerDecorations: innerDeco,
    }),
    [getPosFunc, innerDeco, node, outerDeco]
  );

  if (Component) {
    element = (
      <Component {...finalProps} ref={nodeDomRef} nodeProps={nodeProps}>
        <ChildNodeViews
          getPos={getPos}
          node={node}
          innerDecorations={innerDeco}
        />
      </Component>
    );
  } else if (customNodeView) {
    element = (
      <CustomNodeView
        contentDomRef={contentDomRef}
        customNodeView={customNodeView}
        customNodeViewRef={customNodeViewRef}
        customNodeViewRootRef={customNodeViewRootRef}
        initialInnerDeco={initialInnerDeco}
        initialNode={initialNode}
        initialOuterDeco={initialOuterDeco}
        node={node}
        getPos={getPos}
        innerDeco={innerDeco}
      />
    );
  } else {
    if (outputSpec) {
      element = (
        <OutputSpec {...finalProps} ref={nodeDomRef} outputSpec={outputSpec}>
          <ChildNodeViews
            getPos={getPos}
            node={node}
            innerDecorations={innerDeco}
          />
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

  // Inline nodes will already be wrapped in marks
  // via the ChildNodeViews component
  const markedElement = node.isInline
    ? decoratedElement
    : node.marks.reduce(
        (element, mark) => (
          <MarkView getPos={getPos} mark={mark}>
            {element}
          </MarkView>
        ),
        decoratedElement
      );

  const childContextValue = useMemo(
    () => ({
      parentRef: nodeViewDescRef,
      siblingsRef: childDescriptors,
    }),
    [childDescriptors, nodeViewDescRef]
  );

  return (
    <SelectNodeContext.Provider value={setSelectNode}>
      <StopEventContext.Provider value={setStopEvent}>
        <ChildDescriptorsContext.Provider value={childContextValue}>
          {cloneElement(
            markedElement,
            (node.marks.length && !node.isInline) ||
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              outerDeco.some((d) => (d as any).type.attrs.nodeName)
              ? { ref: domRef }
              : // If all of the node decorations were attr-only, then
                // we've already passed the domRef to the NodeView component
                // as a prop
                undefined
          )}
        </ChildDescriptorsContext.Provider>
      </StopEventContext.Provider>
    </SelectNodeContext.Provider>
  );
});
