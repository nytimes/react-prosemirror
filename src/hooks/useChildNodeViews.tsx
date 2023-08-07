import { Mark, Node } from "prosemirror-model";
import React, { ReactNode, cloneElement, createElement } from "react";

import { MarkView } from "../components/MarkView.js";
import { NodeView } from "../components/NodeView.js";
import { TextNodeView } from "../components/TextNodeView.js";
import { TrailingHackView } from "../components/TrailingHackView.js";
import { WidgetView } from "../components/WidgetView.js";
import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { iterDeco, sameOuterDeco } from "../descriptors/ViewDesc.js";
import {
  DecorationInternal,
  DecorationSourceInternal,
  NonWidgetType,
  ReactWidgetDecoration,
} from "../prosemirror-internal/DecorationInternal.js";

type ChildNode = {
  node: Node;
  innerDeco: DecorationSourceInternal;
  offset: number;
};

type ChildrenNodeViewProps = {
  outerDeco: readonly DecorationInternal[];
  sharedMarks: readonly Mark[];
  innerPos: number;
  nodes: ChildNode[];
};

function ChildrenNodeView({
  outerDeco,
  sharedMarks,
  innerPos,
  nodes,
}: ChildrenNodeViewProps) {
  const childElements: JSX.Element[] = [];
  let queuedSharedMarks: readonly Mark[] = [];
  let queuedNodes: ChildNode[] = [];
  if (nodes.length === 1) {
    const { node, offset, innerDeco } = nodes[0]!;

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

    childElements.push(cloneElement(markedElement, { key: childPos }));
  } else {
    nodes.forEach((childNode) => {
      const uniqueMarks = childNode.node.marks.filter(
        (mark) => !mark.isInSet(sharedMarks)
      );
      const sharedUniqueMarks = uniqueMarks.filter((mark, index) =>
        queuedSharedMarks[index]?.eq(mark)
      );
      if (sharedUniqueMarks.length) {
        queuedSharedMarks = sharedUniqueMarks;
        queuedNodes.push(childNode);
      } else {
        if (queuedNodes.length) {
          childElements.push(
            <ChildrenNodeView
              outerDeco={[]}
              sharedMarks={queuedSharedMarks}
              innerPos={innerPos}
              nodes={queuedNodes}
            />
          );
        }
        queuedNodes = [childNode];
        queuedSharedMarks = childNode.node.marks;
      }
    });
  }

  if (queuedNodes.length) {
    childElements.push(
      <ChildrenNodeView
        outerDeco={[]}
        sharedMarks={queuedSharedMarks}
        innerPos={innerPos}
        nodes={queuedNodes}
      />
    );
  }

  return outerDeco.reduce(
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
}

export function useChildNodeViews(
  pos: number,
  node: Node,
  innerDecorations: DecorationSourceInternal
) {
  const children: ReactNode[] = [];
  const innerPos = pos + 1;

  let queuedOuterDeco: readonly DecorationInternal[] = [];
  let queuedSharedMarks: readonly Mark[] = [];
  let queuedChildNodes: ChildNode[] = [];

  iterDeco(
    node,
    innerDecorations,
    (widget, offset, index) => {
      if (queuedChildNodes.length) {
        children.push(
          <ChildrenNodeView
            key={`${innerPos + offset}`}
            outerDeco={queuedOuterDeco}
            sharedMarks={queuedSharedMarks}
            nodes={queuedChildNodes}
            innerPos={innerPos}
          />
        );
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
        queuedSharedMarks[index]?.eq(mark)
      );
      if (!sameOuterDeco(queuedOuterDeco, outerDeco)) {
        if (queuedChildNodes.length) {
          children.push(
            <ChildrenNodeView
              key={`${innerPos + offset}`}
              outerDeco={queuedOuterDeco}
              sharedMarks={queuedSharedMarks}
              nodes={queuedChildNodes}
              innerPos={innerPos}
            />
          );
        }
        queuedOuterDeco = outerDeco;
        queuedChildNodes = [{ node: childNode, innerDeco, offset }];
        queuedSharedMarks = childNode.marks;
      } else {
        queuedChildNodes.push({ node: childNode, innerDeco, offset });
        queuedSharedMarks = sharedMarks;
      }
    }
  );

  if (queuedChildNodes.length) {
    children.push(
      <ChildrenNodeView
        // This only runs if there's at least one node is the queue
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        key={`${innerPos + queuedChildNodes[0]!.offset}`}
        outerDeco={queuedOuterDeco}
        sharedMarks={queuedSharedMarks}
        nodes={queuedChildNodes}
        innerPos={innerPos}
      />
    );
  }

  if (!children.length) {
    children.push(<TrailingHackView key={innerPos} pos={innerPos} />);
  }

  return children;
}
