import { DOMOutputSpec, Mark, Node } from "prosemirror-model";
import { NodeSelection } from "prosemirror-state";
import React, {
  ForwardRefExoticComponent,
  ReactNode,
  RefAttributes,
  cloneElement,
  createElement,
  useContext,
  useLayoutEffect,
  useRef,
} from "react";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { NodeViewContext } from "../contexts/NodeViewContext.js";
import {
  NodeViewDesc,
  ViewDesc,
  iterDeco,
  sameOuterDeco,
} from "../descriptors/ViewDesc.js";
import {
  DecorationInternal,
  DecorationSourceInternal,
  NonWidgetType,
  ReactWidgetDecoration,
} from "../prosemirror-internal/DecorationInternal.js";

import { MarkView } from "./MarkView.js";
import { NodeViewComponentProps } from "./NodeViewComponentProps.js";
import { OutputSpec } from "./OutputSpec.js";
import { TextNodeView } from "./TextNodeView.js";
import { TrailingHackView } from "./TrailingHackView.js";
import { WidgetView } from "./WidgetView.js";

type QueuedNodes = {
  outerDeco: readonly DecorationInternal[];
  sharedMarks: readonly Mark[];
  innerPos: number;
  nodes: { node: Node; innerDeco: DecorationSourceInternal; offset: number }[];
};

function renderQueuedNodes({
  outerDeco,
  sharedMarks,
  innerPos,
  nodes,
}: QueuedNodes) {
  const childElements = nodes.map(({ node, innerDeco, offset }) => {
    const childPos = innerPos + offset;
    const nodeElement = node.isText ? (
      <ChildDescriptorsContext.Consumer>
        {(siblingDescriptors) => (
          <TextNodeView
            node={node}
            pos={childPos}
            siblingDescriptors={siblingDescriptors}
            decorations={outerDeco}
          />
        )}
      </ChildDescriptorsContext.Consumer>
    ) : (
      <NodeView
        node={node}
        pos={childPos}
        decorations={outerDeco}
        innerDecorations={innerDeco}
      />
    );

    const uniqueMarks: Mark[] = node.marks.filter(
      (mark) => !mark.isInSet(sharedMarks)
    );
    const markedElement = uniqueMarks.reduce(
      (element, mark) => <MarkView mark={mark}>{element}</MarkView>,
      nodeElement
    );

    return cloneElement(markedElement, { key: childPos });
  });

  const childElement = outerDeco.reduce(
    (element, deco) => {
      const {
        nodeName,
        class: className,
        style: _,
        ...attrs
      } = (deco.type as NonWidgetType).attrs;

      if (nodeName) {
        return createElement(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          nodeName!,
          {
            className,
            ...attrs,
          },
          element
        );
      }
      if (Array.isArray(element)) {
        return (
          <>{element.map((el) => cloneElement(el, { className, ...attrs }))}</>
        );
      }
      return cloneElement(element, {
        className,
        ...attrs,
      });
    },

    sharedMarks.reduce(
      (element, mark) => <MarkView mark={mark}>{element}</MarkView>,
      <>{childElements}</>
    )
  );

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return cloneElement(childElement, { key: innerPos + nodes[0]!.offset });
}

type Props = {
  node: Node;
  pos: number;
  decorations: readonly DecorationInternal[];
  innerDecorations: DecorationSourceInternal;
};

export function NodeView({
  node,
  pos,
  decorations,
  innerDecorations,
  ...props
}: Props) {
  const { posToDesc, domToDesc, nodeViews, state } =
    useContext(NodeViewContext);
  const siblingDescriptors = useContext(ChildDescriptorsContext);
  const childDescriptors: ViewDesc[] = [];
  const domRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!domRef.current) return;

    const firstChildDesc = childDescriptors[0];

    const desc = new NodeViewDesc(
      undefined,
      childDescriptors,
      node,
      [],
      innerDecorations,
      domRef.current,
      firstChildDesc?.dom.parentElement ?? null,
      domRef.current ?? domRef.current,
      posToDesc,
      domToDesc
    );
    posToDesc.set(pos, desc);
    domToDesc.set(domRef.current, desc);
    siblingDescriptors.push(desc);

    for (const childDesc of childDescriptors) {
      childDesc.parent = desc;
    }
  });

  const children: ReactNode[] = [];
  const innerPos = pos + 1;

  let queuedChildNodes: QueuedNodes = {
    outerDeco: [],
    sharedMarks: [],
    innerPos,
    nodes: [],
  };

  iterDeco(
    node,
    innerDecorations,
    (widget, offset, index) => {
      if (queuedChildNodes.nodes.length) {
        children.push(renderQueuedNodes(queuedChildNodes));
        queuedChildNodes = {
          outerDeco: [],
          sharedMarks: [],
          innerPos,
          nodes: [],
        };
      }
      children.push(
        <WidgetView
          key={`${innerPos + offset}-${index}`}
          widget={widget as ReactWidgetDecoration}
        />
      );
    },
    (childNode, outerDeco, innerDeco, offset) => {
      const sharedMarks = childNode.marks.filter((mark, index) =>
        queuedChildNodes.sharedMarks[index]?.eq(mark)
      );
      if (
        !sharedMarks.length ||
        !sameOuterDeco(queuedChildNodes.outerDeco, outerDeco)
      ) {
        if (queuedChildNodes.nodes.length) {
          children.push(renderQueuedNodes(queuedChildNodes));
        }
        queuedChildNodes.outerDeco = outerDeco;
        queuedChildNodes.nodes = [{ node: childNode, innerDeco, offset }];
        queuedChildNodes.sharedMarks = childNode.marks;
      } else {
        queuedChildNodes.nodes.push({ node: childNode, innerDeco, offset });
        queuedChildNodes.sharedMarks = sharedMarks;
      }
    }
  );

  if (queuedChildNodes.nodes.length) {
    children.push(renderQueuedNodes(queuedChildNodes));
  }

  if (!children.length) {
    children.push(<TrailingHackView key={innerPos} pos={innerPos} />);
  }

  let element: JSX.Element | null = null;

  const Component:
    | ForwardRefExoticComponent<
        NodeViewComponentProps & RefAttributes<HTMLElement>
      >
    | undefined = nodeViews[node.type.name];

  if (Component) {
    element = (
      <Component
        {...props}
        ref={domRef}
        node={node}
        pos={pos}
        decorations={decorations}
        innerDecorations={innerDecorations}
        isSelected={
          state.selection instanceof NodeSelection &&
          state.selection.node === node
        }
      >
        {children}
      </Component>
    );
  }

  const outputSpec: DOMOutputSpec | undefined = node.type.spec.toDOM?.(node);

  if (outputSpec) {
    element = (
      <OutputSpec {...props} ref={domRef} outputSpec={outputSpec}>
        {children}
      </OutputSpec>
    );
  }

  if (!element) {
    throw new Error(`Node spec for ${node.type.name} is missing toDOM`);
  }

  return (
    <ChildDescriptorsContext.Provider value={childDescriptors}>
      {element}
    </ChildDescriptorsContext.Provider>
  );
}
