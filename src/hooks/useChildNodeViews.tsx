import { Mark, Node } from "prosemirror-model";
import React, {
  MutableRefObject,
  ReactNode,
  cloneElement,
  createElement,
  useRef,
} from "react";

import { MarkView } from "../components/MarkView.js";
import { NodeView } from "../components/NodeView.js";
import { TextNodeView } from "../components/TextNodeView.js";
import { TrailingHackView } from "../components/TrailingHackView.js";
import { WidgetView } from "../components/WidgetView.js";
import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import {
  NonWidgetType,
  ReactWidgetDecoration,
} from "../decorations/ReactWidgetType.js";
import { iterDeco } from "../descriptors/iterDeco.js";
import {
  Decoration,
  DecorationSource,
} from "../prosemirror-view/decoration.js";

import { useNodeViewDescriptor } from "./useNodeViewDescriptor.js";

function sameOuterDeco(a: readonly Decoration[], b: readonly Decoration[]) {
  if (a.length != b.length) return false;
  for (const [i, elA] of a.entries())
    if (!b[i]?.type.eq(elA.type)) return false;
  return true;
}

export function wrapInDeco(element: JSX.Element, deco: Decoration) {
  const {
    nodeName,
    class: className,
    style: _,
    contenteditable: contentEditable,
    ...attrs
  } = (deco.type as unknown as NonWidgetType).attrs;

  if (nodeName || (deco.inline && element.type !== "span")) {
    return createElement(
      nodeName ?? "span",
      {
        className,
        contentEditable,
        ...attrs,
      },
      element
    );
  }
  return cloneElement(element, {
    className: [element.props.className ?? "", className].join(" "),
    contentEditable,
    ...attrs,
  });
}

type ChildNode = {
  node: Node;
  marks: readonly Mark[];
  innerDeco: DecorationSource;
  offset: number;
};

type SharedMarksProps = {
  sharedMarks: readonly Mark[];
  outerDeco: readonly Decoration[];
  innerPos: number;
  nodes: ChildNode[];
  nodeDomRef?: MutableRefObject<HTMLElement | null>;
  domRef?: MutableRefObject<HTMLElement | null>;
};

function SharedMarks({
  outerDeco,
  sharedMarks,
  innerPos,
  nodes,
  nodeDomRef,
  domRef,
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
        // We always pass a nodeDomRef if we're rendering
        // non-inline nodes
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        nodeDomRef={nodeDomRef!}
        domRef={domRef}
      />
    );

    const inlineDecorations = outerDeco.filter((deco) => deco.inline);

    const markedElement = sharedMarks
      .concat(marks)
      .reduce(
        (element, mark) => <MarkView mark={mark}>{element}</MarkView>,
        inlineDecorations.reduce(wrapInDeco, nodeElement)
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
            nodeDomRef={nodeDomRef}
            domRef={domRef}
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
        nodeDomRef={nodeDomRef}
        domRef={domRef}
      />
    );
  }

  return sharedMarks.reduce(
    (element, mark) => <MarkView mark={mark}>{element}</MarkView>,
    <>{childElements}</>
  );
}

type NodeDecoViewProps = {
  outerDeco: readonly Decoration[];
  pos: number;
  node: Node;
  innerDeco: DecorationSource;
};

function NodeDecoView({ outerDeco, pos, node, innerDeco }: NodeDecoViewProps) {
  const domRef = useRef<HTMLElement | null>(null);
  const nodeDomRef = useRef<HTMLElement | null>(null);

  const childDescriptors = useNodeViewDescriptor(
    node,
    domRef,
    nodeDomRef,
    innerDeco,
    outerDeco
  );

  const markedElement = node.marks.reduce(
    (element, mark) => <MarkView mark={mark}>{element}</MarkView>,
    <NodeView
      node={node}
      pos={pos}
      decorations={outerDeco}
      innerDecorations={innerDeco}
      nodeDomRef={nodeDomRef}
      domRef={domRef}
    />
  );

  const nodeDecorations = outerDeco.filter((deco) => !deco.inline);
  if (!nodeDecorations.length) {
    return (
      <ChildDescriptorsContext.Provider value={childDescriptors}>
        {markedElement}
      </ChildDescriptorsContext.Provider>
    );
  }

  const decoratedElement = nodeDecorations.reduce(wrapInDeco, markedElement);

  return (
    <ChildDescriptorsContext.Provider value={childDescriptors}>
      {cloneElement(
        decoratedElement,
        nodeDecorations.every(
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

export function useChildNodeViews(
  pos: number,
  node: Node | undefined,
  innerDecorations: DecorationSource
) {
  if (!node) return null;
  const children: ReactNode[] = [];
  const innerPos = pos + 1;

  let queuedOuterDeco: readonly Decoration[] = [];
  let queuedChildNodes: ChildNode[] = [];

  iterDeco(
    node,
    innerDecorations,
    (widget, offset, index) => {
      if (queuedChildNodes.length) {
        children.push(
          <SharedMarks
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            key={`${innerPos + queuedChildNodes[0]!.offset}`}
            sharedMarks={[]}
            outerDeco={queuedOuterDeco}
            nodes={queuedChildNodes}
            innerPos={innerPos}
          ></SharedMarks>
        );
      }
      children.push(
        <WidgetView
          key={`${innerPos + offset}-${index}`}
          widget={widget as unknown as ReactWidgetDecoration}
        />
      );
      queuedChildNodes = [];
      queuedOuterDeco = [];
    },
    (childNode, outerDeco, innerDeco, offset) => {
      if (!childNode.isInline) {
        children.push(
          <NodeDecoView
            key={`${innerPos + offset}`}
            outerDeco={outerDeco}
            node={childNode}
            innerDeco={innerDeco}
            pos={innerPos + offset}
          />
        );
        return;
      }
      if (!sameOuterDeco(queuedOuterDeco, outerDeco)) {
        if (queuedChildNodes.length) {
          children.push(
            <SharedMarks
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              key={`${innerPos + queuedChildNodes[0]!.offset}`}
              sharedMarks={[]}
              outerDeco={queuedOuterDeco}
              nodes={queuedChildNodes}
              innerPos={innerPos}
            ></SharedMarks>
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
      <SharedMarks
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        key={`${innerPos + queuedChildNodes[0]!.offset}`}
        sharedMarks={[]}
        outerDeco={queuedOuterDeco}
        nodes={queuedChildNodes}
        innerPos={innerPos}
      ></SharedMarks>
    );
  }

  if (!children.length) {
    children.push(<TrailingHackView key={innerPos} />);
  }

  return children;
}
