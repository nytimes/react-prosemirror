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
  marks: readonly Mark[];
  innerDeco: DecorationSourceInternal;
  offset: number;
};

type SharedMarksProps = {
  sharedMarks: readonly Mark[];
  outerDeco: readonly DecorationInternal[];
  innerPos: number;
  nodes: ChildNode[];
};

function SharedMarks({
  outerDeco,
  sharedMarks,
  innerPos,
  nodes,
}: SharedMarksProps) {
  if (nodes.length === 1) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { node, marks, offset, innerDeco } = nodes[0]!;
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

    const markedElement = sharedMarks
      .concat(marks)
      .reduce(
        (element, mark) => <MarkView mark={mark}>{element}</MarkView>,
        nodeElement
      );

    return cloneElement(markedElement, { key: childPos });
  }

  const childElements: JSX.Element[] = [];

  let queuedSharedMarks: readonly Mark[] = [];
  let queuedChildNodes: ChildNode[] = [];

  for (const childNode of nodes) {
    const filteredMarks = childNode.marks.filter((mark, index) =>
      queuedSharedMarks[index]?.eq(mark)
    );
    if (filteredMarks.length) {
      queuedSharedMarks = filteredMarks;
      queuedChildNodes.push(childNode);
    } else {
      if (queuedChildNodes.length) {
        childElements.push(
          <SharedMarks
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            key={`${innerPos + queuedChildNodes[0]!.offset}`}
            sharedMarks={queuedSharedMarks}
            outerDeco={outerDeco}
            innerPos={innerPos}
            nodes={queuedChildNodes.map((childNode) => ({
              ...childNode,
              marks: childNode.marks.slice(queuedSharedMarks.length),
            }))}
          />
        );
      }
      queuedSharedMarks = childNode.marks;
      queuedChildNodes = [childNode];
    }
  }

  if (queuedChildNodes.length) {
    childElements.push(
      <SharedMarks
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        key={`${innerPos + queuedChildNodes[0]!.offset}`}
        sharedMarks={queuedSharedMarks}
        outerDeco={outerDeco}
        innerPos={innerPos}
        nodes={queuedChildNodes.map((childNode) => ({
          ...childNode,
          marks: childNode.marks.slice(queuedSharedMarks.length),
        }))}
      />
    );
  }

  return sharedMarks.reduce(
    (element, mark) => <MarkView mark={mark}>{element}</MarkView>,
    <>{childElements}</>
  );
}

type OuterDecoViewProps = {
  outerDeco: readonly DecorationInternal[];
  innerPos: number;
  nodes: ChildNode[];
};

function OuterDecoView({ outerDeco, innerPos, nodes }: OuterDecoViewProps) {
  return outerDeco.reduce(
    (element, deco) => {
      const {
        nodeName,
        class: className,
        style: _,
        ...attrs
      } = (deco.type as NonWidgetType).attrs;

      if (nodeName || nodes[0]?.node.isText) {
        return createElement(
          nodeName ?? "span",
          {
            className,
            ...attrs,
          },
          element
        );
      }
      return cloneElement(element, {
        className,
        ...attrs,
      });
    },

    <SharedMarks
      sharedMarks={[]}
      nodes={nodes}
      innerPos={innerPos}
      outerDeco={outerDeco}
    ></SharedMarks>
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
  let queuedChildNodes: ChildNode[] = [];

  iterDeco(
    node,
    innerDecorations,
    (widget, offset, index) => {
      if (queuedChildNodes.length) {
        children.push(
          <OuterDecoView
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            key={`${innerPos + queuedChildNodes[0]!.offset}`}
            outerDeco={queuedOuterDeco}
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
      queuedChildNodes = [];
      queuedOuterDeco = [];
    },
    (childNode, outerDeco, innerDeco, offset) => {
      if (!sameOuterDeco(queuedOuterDeco, outerDeco)) {
        if (queuedChildNodes.length) {
          children.push(
            <OuterDecoView
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              key={`${innerPos + queuedChildNodes[0]!.offset}`}
              outerDeco={queuedOuterDeco}
              nodes={queuedChildNodes}
              innerPos={innerPos}
            />
          );
        }
        queuedOuterDeco = outerDeco;
        queuedChildNodes = [
          { node: childNode, marks: childNode.marks, innerDeco, offset },
        ];
      } else {
        queuedChildNodes.push({
          node: childNode,
          marks: childNode.marks,
          innerDeco,
          offset,
        });
      }
    }
  );

  if (queuedChildNodes.length) {
    children.push(
      <OuterDecoView
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        key={`${innerPos + queuedChildNodes[0]!.offset}`}
        outerDeco={queuedOuterDeco}
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
