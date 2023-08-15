import classnames from "classnames/dedupe";
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

function cssToStyles(css: string) {
  const cssJson = `{"${css
    .replace(/; */g, '","')
    .replace(/: */g, '":"')
    .replace(";", "")}"}`;

  const obj = JSON.parse(cssJson);

  return Object.keys(obj).reduce((acc, key) => {
    const camelCased = key.startsWith("--")
      ? key
      : key.replace(/-[a-z]/g, (g) => g[1]?.toUpperCase() ?? "");
    return { ...acc, [camelCased]: obj[key] };
  }, {});
}

export function wrapInDeco(node: Node) {
  // Not a component.. but... maybe should be a component??
  // eslint-disable-next-line react/display-name
  return function (element: JSX.Element, deco: Decoration) {
    const {
      nodeName,
      class: className,
      style: css,
      contenteditable: contentEditable,
      ...attrs
    } = (deco.type as unknown as NonWidgetType).attrs;

    // We auto-wrap text nodes in spans so that we can apply attributes
    // and styles, but we want to avoid double-wrapping the same
    // text node
    if (nodeName || (node.isText && element.type !== "span")) {
      return createElement(
        nodeName ?? "span",
        {
          className,
          contentEditable,
          style: css && cssToStyles(css),
          ...attrs,
        },
        element
      );
    }

    return cloneElement(element, {
      className: classnames(element.props.className, className),
      contentEditable,
      style: css && cssToStyles(css),
      ...attrs,
    });
  };
}

function mergeInlineDecorations(decorations: readonly Decoration[]) {
  const merged: Decoration[] = [];
  for (const deco of decorations) {
    const lastMerged = merged.pop();
    if (!lastMerged) {
      merged.push(deco);
      continue;
    }
    const {
      nodeName,
      class: className,
      style: css,
      contenteditable: contentEditable,
      ...attrs
    } = (deco.type as unknown as NonWidgetType).attrs;

    const lastMergedType = lastMerged.type as unknown as NonWidgetType;

    // TODO: make sure specs are shallowly equal too
    if (lastMergedType.attrs.nodeName && nodeName) {
      merged.push(lastMerged);
      merged.push(deco);
      continue;
    }

    merged.push(
      Decoration.inline(
        lastMerged.from,
        lastMerged.to,
        {
          ...lastMergedType.attrs,
          nodeName: lastMergedType.attrs.nodeName ?? nodeName,
          class: classnames(lastMergedType.attrs.class, className),
          contenteditable:
            (lastMergedType.attrs.contenteditable && contentEditable) ??
            lastMergedType.attrs.contenteditable,
          ...attrs,
        },
        {}
      )
    );
  }
  return merged;
}

type ChildWidget = {
  type: "widget";
  widget: ReactWidgetDecoration;
  marks: readonly Mark[];
  offset: number;
  index: number;
};

type ChildNode = {
  type: "node";
  node: Node;
  marks: readonly Mark[];
  innerDeco: DecorationSource;
  offset: number;
};

type Child = ChildNode | ChildWidget;

type SharedMarksProps = {
  sharedMarks: readonly Mark[];
  outerDeco: readonly Decoration[];
  innerPos: number;
  nodes: Child[];
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
    const child = nodes[0]!;
    const childPos = innerPos + child.offset;
    const inlineDecorations = mergeInlineDecorations(
      outerDeco.filter((deco) => deco.inline)
    );

    const childElement =
      child.type === "widget" ? (
        <WidgetView
          widget={child.widget as unknown as ReactWidgetDecoration}
          pos={childPos}
        />
      ) : (
        inlineDecorations.reduce(
          wrapInDeco(child.node),
          child.node.isText ? (
            <ChildDescriptorsContext.Consumer>
              {(siblingDescriptors) => (
                <TextNodeView
                  node={child.node}
                  siblingDescriptors={siblingDescriptors}
                  decorations={outerDeco}
                />
              )}
            </ChildDescriptorsContext.Consumer>
          ) : (
            <NodeView
              node={child.node}
              pos={childPos}
              decorations={outerDeco}
              innerDecorations={child.innerDeco}
              // We always pass a nodeDomRef if we're rendering
              // non-inline nodes
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              nodeDomRef={nodeDomRef!}
              domRef={domRef}
            />
          )
        )
      );

    const markedElement = sharedMarks
      .concat(child.marks)
      .reduce(
        (element, mark) => <MarkView mark={mark}>{element}</MarkView>,
        childElement
      );

    return cloneElement(markedElement, { key: createKey(innerPos, child) });
  }

  const childElements: JSX.Element[] = [];

  let queuedSharedMarks: readonly Mark[] = [];
  let queuedChildNodes: Child[] = [];

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
            key={createKey(innerPos, queuedChildNodes[0]!)}
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

  const decoratedElement = nodeDecorations.reduce(
    wrapInDeco(node),
    markedElement
  );

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

function createKey(innerPos: number, child: Child) {
  return child.type === "widget" && child.widget.type.spec.key
    ? child.widget.type.spec.key
    : `${innerPos + child.offset}` +
        (child.type === "widget" ? `-${child.index}` : "");
}

function adjustWidgetMarks(children: Child[]) {
  const lastChild = children[children.length - 1];
  if (lastChild?.type !== "node") return;

  const marksToSpread = lastChild.marks;
  for (let i = children.length - 2; i >= 0; i--) {
    const child = children[i];
    if (child?.type !== "widget" || child.widget.type.side < 0) break;

    child.marks = child.marks.reduce(
      (acc, mark) => mark.addToSet(acc),
      marksToSpread
    );
  }
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
  let queuedChildNodes: Child[] = [];

  iterDeco(
    node,
    innerDecorations,
    (widget, offset, index) => {
      const widgetMarks = widget.type.spec.marks ?? [];
      if (queuedOuterDeco.length) {
        if (queuedChildNodes.length) {
          children.push(
            <SharedMarks
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              key={createKey(innerPos, queuedChildNodes[0]!)}
              sharedMarks={[]}
              outerDeco={queuedOuterDeco}
              nodes={queuedChildNodes}
              innerPos={innerPos}
            ></SharedMarks>
          );
        }
        queuedOuterDeco = [];
        queuedChildNodes = [
          {
            type: "widget",
            widget: widget,
            marks: widgetMarks,
            offset,
            index,
          },
        ];
      } else {
        queuedChildNodes.push({
          type: "widget",
          widget: widget,
          marks:
            widget.type.side >= 0
              ? widgetMarks
              : widgetMarks.reduce(
                  (acc, mark) => mark.addToSet(acc),
                  queuedChildNodes[0]?.marks ?? []
                ),
          offset,
          index,
        });
      }
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
              key={createKey(innerPos, queuedChildNodes[0]!)}
              sharedMarks={[]}
              outerDeco={queuedOuterDeco}
              nodes={queuedChildNodes}
              innerPos={innerPos}
            ></SharedMarks>
          );
        }
        queuedOuterDeco = outerDeco;
        queuedChildNodes = [
          {
            type: "node",
            node: childNode,
            marks: childNode.marks,
            innerDeco,
            offset,
          },
        ];
      } else {
        queuedChildNodes.push({
          type: "node",
          node: childNode,
          marks: childNode.marks,
          innerDeco,
          offset,
        });
        adjustWidgetMarks(queuedChildNodes);
      }
    }
  );

  if (queuedChildNodes.length) {
    children.push(
      <SharedMarks
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        key={createKey(innerPos, queuedChildNodes[0]!)}
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
