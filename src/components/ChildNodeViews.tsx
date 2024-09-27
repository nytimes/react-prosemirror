import { Mark, Node } from "prosemirror-model";
import { Decoration, DecorationSource } from "prosemirror-view";
import React, {
  ReactNode,
  cloneElement,
  createElement,
  memo,
  useContext,
} from "react";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { EditorContext } from "../contexts/EditorContext.js";
import { ReactWidgetDecoration } from "../decorations/ReactWidgetType.js";
import { iterDeco } from "../decorations/iterDeco.js";
// import { useEditorState } from "../hooks/useEditorState.js";
import { useReactKeys } from "../hooks/useReactKeys.js";
import { htmlAttrsToReactProps, mergeReactProps } from "../props.js";

import { MarkView } from "./MarkView.js";
import { NativeWidgetView } from "./NativeWidgetView.js";
import { NodeView } from "./NodeView.js";
import { SeparatorHackView } from "./SeparatorHackView.js";
import { TextNodeView } from "./TextNodeView.js";
import { TrailingHackView } from "./TrailingHackView.js";
import { WidgetView } from "./WidgetView.js";

export function wrapInDeco(reactNode: JSX.Element | string, deco: Decoration) {
  const {
    nodeName,
    ...attrs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = (deco as any).type.attrs;

  const props = htmlAttrsToReactProps(attrs);

  // We auto-wrap text nodes in spans so that we can apply attributes
  // and styles, but we want to avoid double-wrapping the same
  // text node
  if (nodeName || typeof reactNode === "string") {
    return createElement(nodeName ?? "span", props, reactNode);
  }

  return cloneElement(reactNode, mergeReactProps(reactNode.props, props));
}

type ChildWidget = {
  type: "widget";
  widget: ReactWidgetDecoration;
  marks: readonly Mark[];
  offset: number;
  index: number;
};

type ChildNativeWidget = {
  type: "native-widget";
  widget: Decoration;
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

type ChildTrailingHack = {
  type: "trailinghack";
  offset: 0;
};

type Child = ChildNode | ChildWidget | ChildNativeWidget;

type SharedMarksProps = {
  innerPos: number;
  childViews: Child[];
};

const InlineView = memo(function InlineView({
  innerPos,
  childViews,
}: SharedMarksProps) {
  const { view } = useContext(EditorContext);
  // const editorState = useEditorState();
  const reactKeys = useReactKeys();

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
              ) : child.type === "native-widget" ? (
                <NativeWidgetView widget={child.widget} pos={childPos} />
              ) : child.node.isText ? (
                <ChildDescriptorsContext.Consumer>
                  {({ siblingsRef, parentRef }) => (
                    <TextNodeView
                      view={view}
                      node={child.node}
                      pos={childPos}
                      siblingsRef={siblingsRef}
                      parentRef={parentRef}
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
              key: createKey(
                // editorState.doc,
                innerPos,
                child,
                reactKeys?.posToKey
              ),
            });
          });
        }

        return (
          <MarkView
            key={createKey(
              // editorState?.doc,
              innerPos,
              firstChild,
              reactKeys?.posToKey
            )}
            mark={firstMark}
          >
            <InlineView
              key={createKey(
                // editorState?.doc,
                innerPos,
                firstChild,
                reactKeys?.posToKey
              )}
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
});

function createKey(
  // doc: Node | undefined,
  innerPos: number,
  child: Child | ChildTrailingHack,
  posToKey: Map<number, string> | undefined
) {
  const pos = innerPos + child.offset;
  const key = posToKey?.get(pos);

  if (child.type === "widget" || child.type === "native-widget") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((child.widget as any).type.spec.key)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (child.widget as any).type.spec.key;

    // eslint-disable-next-line no-console
    console.warn(
      `Widget at position ${pos} doesn't have a key specified. This has negative performance implications.`
    );
    return `${key}-${child.index}`;
  }

  if (key) return key;

  // if (!doc) return pos;

  // const parentPos = doc.resolve(pos).start() - 1;

  // const parentKey = posToKey?.get(parentPos);

  // if (parentKey) return `${parentKey}-${child.offset}`;

  return pos;
}

function adjustWidgetMarksForward(children: Child[]) {
  const lastChild = children[children.length - 1];
  if (
    (lastChild?.type !== "widget" && lastChild?.type !== "native-widget") ||
    // Using internal Decoration property, "type"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (lastChild.widget as any).type.side >= 0
  )
    return;

  let lastNodeChild: ChildNode | null = null;
  for (let i = children.length - 2; i >= 0; i--) {
    const child = children[i];
    if (child?.type === "node") {
      lastNodeChild = child;
      break;
    }
  }

  if (!lastNodeChild || !lastNodeChild.node.isInline) return;

  const marksToSpread = lastNodeChild.marks;

  lastChild.marks = lastChild.marks.reduce(
    (acc, mark) => mark.addToSet(acc),
    marksToSpread
  );
}

function adjustWidgetMarksBack(children: Child[]) {
  const lastChild = children[children.length - 1];
  if (lastChild?.type !== "node" || !lastChild.node.isInline) return;

  const marksToSpread = lastChild.marks;
  for (let i = children.length - 2; i >= 0; i--) {
    const child = children[i];
    if (
      (child?.type !== "widget" && child?.type !== "native-widget") ||
      // Using internal Decoration property, "type"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (child.widget as any).type.side < 0
    )
      break;

    child.marks = child.marks.reduce(
      (acc, mark) => mark.addToSet(acc),
      marksToSpread
    );
  }
}

function createChildElements(
  children: Child[],
  innerPos: number,
  // doc: Node | undefined,
  posToKey: Map<number, string> | undefined
): ReactNode[] {
  if (!children.length) return [];

  if (children.every((child) => child.type !== "node" || child.node.isInline)) {
    return [
      <InlineView
        key={createKey(
          // doc,
          innerPos,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          children[0]!,
          posToKey
        )}
        childViews={children}
        innerPos={innerPos}
      />,
    ];
  }

  return children.map((child) => {
    if (child.type === "node") {
      const pos = innerPos + child.offset;
      const key = posToKey?.get(pos) ?? pos;
      return (
        <NodeView
          key={key}
          outerDeco={child.outerDeco}
          node={child.node}
          innerDeco={child.innerDeco}
          pos={pos}
        />
      );
    } else {
      return (
        <InlineView
          key={createKey(
            // doc,
            innerPos,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            child,
            posToKey
          )}
          childViews={[child]}
          innerPos={innerPos}
        />
      );
    }
  });
}

export const ChildNodeViews = memo(function ChildNodeViews({
  pos,
  node,
  innerDecorations,
}: {
  pos: number;
  node: Node | undefined;
  innerDecorations: DecorationSource;
}) {
  // const editorState = useEditorState();
  const reactKeys = useReactKeys();

  if (!node) return null;
  const innerPos = pos + 1;

  const children: Child[] = [];

  iterDeco(
    node,
    innerDecorations,
    (widget, isNative, offset, index) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const widgetMarks = ((widget as any).type.spec.marks as Mark[]) ?? [];
      if (isNative) {
        children.push({
          type: "native-widget",
          widget: widget,
          marks: widgetMarks,
          offset,
          index,
        });
      } else {
        children.push({
          type: "widget",
          widget: widget as ReactWidgetDecoration,
          marks: widgetMarks,
          offset,
          index,
        });
      }
      adjustWidgetMarksForward(children);
    },
    (childNode, outerDeco, innerDeco, offset) => {
      children.push({
        type: "node",
        node: childNode,
        marks: childNode.marks,
        innerDeco,
        outerDeco,
        offset,
      });
      adjustWidgetMarksBack(children);
    }
  );

  const childElements = createChildElements(
    children,
    innerPos,
    // editorState.doc,
    reactKeys?.posToKey
  );

  const lastChild = children[children.length - 1];

  if (
    !lastChild ||
    lastChild.type !== "node" ||
    (lastChild.node.isInline && !lastChild.node.isText) ||
    // RegExp.test actually handles undefined just fine
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    /\n$/.test(lastChild.node.text!)
  ) {
    childElements.push(
      <SeparatorHackView key="trailing-hack-img" />,
      <TrailingHackView key="trailing-hack-br" />
    );
  }

  return <>{childElements}</>;
});
