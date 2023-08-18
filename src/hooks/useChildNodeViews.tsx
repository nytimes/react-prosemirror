import classnames from "classnames/dedupe";
import { Mark, Node } from "prosemirror-model";
import React, { ReactNode, cloneElement, createElement } from "react";

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

export function wrapInDeco(reactNode: JSX.Element | string, deco: Decoration) {
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
  if (nodeName || typeof reactNode === "string") {
    return createElement(
      nodeName ?? "span",
      {
        className,
        contentEditable,
        style: css && cssToStyles(css),
        ...attrs,
      },
      reactNode
    );
  }

  return cloneElement(reactNode, {
    className: classnames(reactNode.props.className, className),
    contentEditable,
    style: css && cssToStyles(css),
    ...attrs,
  });
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
  outerDeco: readonly Decoration[];
  offset: number;
};

type Child = ChildNode | ChildWidget;

type SharedMarksProps = {
  innerPos: number;
  childViews: Child[];
};

function InlineView({ innerPos, childViews }: SharedMarksProps) {
  const partitioned = childViews.reduce((acc, child) => {
    const lastPartition = acc[acc.length - 1];
    if (!lastPartition) {
      return [[child]];
    }
    const lastChild = lastPartition[lastPartition.length - 1];
    if (!lastChild) {
      return [...acc.slice(0, acc.length), [child]];
    }

    if (
      (!child.marks.length && !lastChild.marks.length) ||
      (child.marks.length &&
        lastChild.marks.length &&
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        child.marks[0]?.eq(lastChild.marks[0]!))
    ) {
      return [
        ...acc.slice(0, acc.length - 1),
        [...lastPartition.slice(0, lastPartition.length), child],
      ];
    }

    return [...acc, [child]];
  }, [] as Child[][]);

  return (
    <>
      {partitioned.map((childViews) => {
        const firstChild = childViews[0];
        if (!firstChild) return null;

        const firstMark = firstChild.marks[0];
        if (!firstMark) {
          return childViews.map((child) => {
            const childPos = innerPos + child.offset;

            const childElement =
              child.type === "widget" ? (
                <WidgetView
                  widget={child.widget as unknown as ReactWidgetDecoration}
                  pos={childPos}
                />
              ) : child.node.isText ? (
                <ChildDescriptorsContext.Consumer>
                  {(siblingDescriptors) => (
                    <TextNodeView
                      node={child.node}
                      siblingDescriptors={siblingDescriptors}
                      decorations={child.outerDeco}
                    />
                  )}
                </ChildDescriptorsContext.Consumer>
              ) : (
                <NodeView
                  node={child.node}
                  pos={childPos}
                  outerDeco={child.outerDeco}
                  innerDeco={child.innerDeco}
                />
              );

            return cloneElement(childElement, {
              key: createKey(innerPos, child),
            });
          });
        }

        return (
          <MarkView key={createKey(innerPos, firstChild)} mark={firstMark}>
            <InlineView
              key={createKey(innerPos, firstChild)}
              innerPos={innerPos}
              childViews={childViews.map((child) => ({
                ...child,
                marks: child.marks.slice(1),
              }))}
            />
          </MarkView>
        );
      })}
    </>
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

  const queuedChildNodes: Child[] = [];

  iterDeco(
    node,
    innerDecorations,
    (widget, offset, index) => {
      const widgetMarks = widget.type.spec.marks ?? [];
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
    },
    (childNode, outerDeco, innerDeco, offset) => {
      if (!childNode.isInline) {
        children.push(
          <NodeView
            key={`${innerPos + offset}`}
            outerDeco={outerDeco}
            node={childNode}
            innerDeco={innerDeco}
            pos={innerPos + offset}
          />
        );
        return;
      }
      queuedChildNodes.push({
        type: "node",
        node: childNode,
        marks: childNode.marks,
        innerDeco,
        outerDeco,
        offset,
      });
      adjustWidgetMarks(queuedChildNodes);
    }
  );

  if (queuedChildNodes.length) {
    children.push(
      <InlineView
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        key={createKey(innerPos, queuedChildNodes[0]!)}
        childViews={queuedChildNodes}
        innerPos={innerPos}
      ></InlineView>
    );
  }

  if (!children.length) {
    children.push(<TrailingHackView key={innerPos} />);
  }

  return children;
}
