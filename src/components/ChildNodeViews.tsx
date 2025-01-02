import { Mark, Node } from "prosemirror-model";
import { Decoration, DecorationSource } from "prosemirror-view";
import React, {
  MutableRefObject,
  ReactNode,
  cloneElement,
  createElement,
  memo,
  useContext,
  useRef,
} from "react";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { EditorContext } from "../contexts/EditorContext.js";
import { ReactWidgetDecoration } from "../decorations/ReactWidgetType.js";
import { InternalDecorationSource } from "../decorations/internalTypes.js";
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

function areChildrenEqual(a: Child, b: Child) {
  return (
    a.type === b.type &&
    a.marks.every((mark) => mark.isInSet(b.marks)) &&
    b.marks.every((mark) => mark.isInSet(a.marks)) &&
    a.key === b.key &&
    (a.type === "node"
      ? a.outerDeco?.length === (b as ChildNode).outerDeco?.length &&
        a.outerDeco?.every((prevDeco) =>
          (b as ChildNode).outerDeco?.some(
            (nextDeco) =>
              prevDeco.from === nextDeco.from &&
              prevDeco.to &&
              nextDeco.to &&
              (prevDeco as any).type.eq((nextDeco as any).type)
          )
        ) &&
        (a.innerDeco as InternalDecorationSource).eq((b as ChildNode).innerDeco)
      : true) &&
    (a as ChildNode).node === (b as ChildNode).node &&
    (a as ChildWidget).widget === (b as ChildWidget).widget
  );
}

type ChildWidget = {
  type: "widget";
  widget: ReactWidgetDecoration;
  marks: readonly Mark[];
  offset: number;
  index: number;
  key: string;
};

type ChildNativeWidget = {
  type: "native-widget";
  widget: Decoration;
  marks: readonly Mark[];
  offset: number;
  index: number;
  key: string;
};

type ChildNode = {
  type: "node";
  node: Node;
  marks: readonly Mark[];
  innerDeco: DecorationSource;
  outerDeco: readonly Decoration[];
  offset: number;
  key: string;
};

type Child = ChildNode | ChildWidget | ChildNativeWidget;

type SharedMarksProps = {
  getInnerPos: MutableRefObject<() => number>;
  childViews: Child[];
};

const ChildView = memo(function ChildView({
  child,
  getInnerPos,
}: {
  child: Child;
  getInnerPos: MutableRefObject<() => number>;
}) {
  const { view } = useContext(EditorContext);
  const getChildPos = useRef(() => getInnerPos.current() + child.offset);
  getChildPos.current = () => getInnerPos.current() + child.offset;

  return child.type === "widget" ? (
    <WidgetView
      key={child.key}
      widget={child.widget as unknown as ReactWidgetDecoration}
      getPos={getChildPos}
    />
  ) : child.type === "native-widget" ? (
    <NativeWidgetView
      key={child.key}
      widget={child.widget}
      getPos={getChildPos}
    />
  ) : child.node.isText ? (
    <ChildDescriptorsContext.Consumer key={child.key}>
      {({ siblingsRef, parentRef }) => (
        <TextNodeView
          view={view}
          node={child.node}
          getPos={getChildPos}
          siblingsRef={siblingsRef}
          parentRef={parentRef}
          decorations={child.outerDeco}
        />
      )}
    </ChildDescriptorsContext.Consumer>
  ) : (
    <NodeView
      key={child.key}
      node={child.node}
      getPos={getChildPos}
      outerDeco={child.outerDeco}
      innerDeco={child.innerDeco}
    />
  );
});

const InlinePartition = memo(function InlinePartition({
  childViews,
  getInnerPos,
}: {
  childViews: [Child, ...Child[]];
  getInnerPos: MutableRefObject<() => number>;
}) {
  const firstChild = childViews[0];
  const getFirstChildPos = useRef(
    () => getInnerPos.current() + firstChild.offset
  );
  getFirstChildPos.current = () => getInnerPos.current() + firstChild.offset;

  const firstMark = firstChild.marks[0];
  if (!firstMark) {
    return (
      <>
        {childViews.map((child) => {
          return (
            <ChildView
              key={child.key}
              child={child}
              getInnerPos={getInnerPos}
            />
          );
        })}
      </>
    );
  }

  return (
    <MarkView getPos={getFirstChildPos} key={firstChild.key} mark={firstMark}>
      <InlineView
        key={firstChild.key}
        getInnerPos={getInnerPos}
        childViews={childViews.map((child) => ({
          ...child,
          marks: child.marks.slice(1),
        }))}
      />
    </MarkView>
  );
});

const InlineView = memo(function InlineView({
  getInnerPos,
  childViews,
}: SharedMarksProps) {
  // const editorState = useEditorState();
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
        return (
          <InlinePartition
            key={firstChild.key}
            childViews={childViews as [Child, ...Child[]]}
            getInnerPos={getInnerPos}
          />
        );
      })}
    </>
  );
});

function createKey(
  innerPos: number,
  offset: number,
  type: Child["type"],
  posToKey: Map<number, string> | undefined,
  widget?: ReactWidgetDecoration | Decoration,
  index?: number
) {
  const pos = innerPos + offset;
  const key = posToKey?.get(pos);

  if (type === "widget" || type === "native-widget") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((widget as any).type.spec.key)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (widget as any).type.spec.key;

    // eslint-disable-next-line no-console
    console.warn(
      `Widget at position ${pos} doesn't have a key specified. This may cause issues.`
    );
    return `${key}-${index}`;
  }

  if (key) return key;

  // if (!doc) return pos;

  const parentPos = innerPos - 1;

  const parentKey = posToKey?.get(parentPos);

  if (parentKey) return `${parentKey}-${offset}`;

  return pos;
}

function adjustWidgetMarksForward(
  lastNodeChild: ChildNode | null,
  widgetChild: ChildWidget | ChildNativeWidget | null
) {
  if (
    !widgetChild ||
    // Using internal Decoration property, "type"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (widgetChild.widget as any).type.side >= 0
  )
    return;

  if (!lastNodeChild || !lastNodeChild.node.isInline) return;

  const marksToSpread = lastNodeChild.marks;

  widgetChild.marks = widgetChild.marks.reduce(
    (acc, mark) => mark.addToSet(acc),
    marksToSpread
  );
}

function adjustWidgetMarksBack(
  widgetChildren: Array<ChildNativeWidget | ChildWidget>,
  nodeChild: ChildNode
) {
  if (!nodeChild.node.isInline) return;

  const marksToSpread = nodeChild.marks;
  for (let i = widgetChildren.length - 1; i >= 0; i--) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const child = widgetChildren[i]!;

    if (
      // Using internal Decoration property, "type"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (child.widget as any).type.side < 0
    ) {
      continue;
    }

    child.marks = child.marks.reduce(
      (acc, mark) => mark.addToSet(acc),
      marksToSpread
    );
  }
}

const ChildElement = memo(
  function ChildElement({
    child,
    getInnerPos,
  }: {
    child: Child;
    getInnerPos: MutableRefObject<() => number>;
  }) {
    const getNodePos = useRef(() => getInnerPos.current() + child.offset);
    getNodePos.current = () => getInnerPos.current() + child.offset;

    if (child.type === "node") {
      return child.marks.reduce(
        (element, mark) => (
          <MarkView getPos={getNodePos} mark={mark}>
            {element}
          </MarkView>
        ),
        <NodeView
          key={child.key}
          outerDeco={child.outerDeco}
          node={child.node}
          innerDeco={child.innerDeco}
          getPos={getNodePos}
        />
      );
    } else {
      return (
        <InlineView
          key={child.key}
          childViews={[child]}
          getInnerPos={getInnerPos}
        />
      );
    }
  }
  /**
   * It's safe to skip re-rendering a ChildElement component as long
   * as its child prop is shallowly equivalent to the previous render.
   * posToKey will be updated on every doc update, but if the child
   * hasn't changed, it will still have the same key.
   */
  // (prevProps, nextProps) => areChildrenEqual(prevProps.child, nextProps.child)
);

function createChildElements(
  children: Child[],
  getInnerPos: MutableRefObject<() => number>
): ReactNode[] {
  if (!children.length) return [];

  if (children.every((child) => child.type !== "node" || child.node.isInline)) {
    return [
      <InlineView
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        key={children[0]!.key}
        childViews={children}
        getInnerPos={getInnerPos}
      />,
    ];
  }

  return children.map((child) => {
    return (
      <ChildElement key={child.key} child={child} getInnerPos={getInnerPos} />
    );
  });
}

export const ChildNodeViews = memo(function ChildNodeViews({
  getPos,
  node,
  innerDecorations,
}: {
  getPos: MutableRefObject<() => number>;
  node: Node | undefined;
  innerDecorations: DecorationSource;
}) {
  // const editorState = useEditorState();
  const reactKeys = useReactKeys();

  const getInnerPos = useRef(() => getPos.current() + 1);

  const childMap = useRef(new Map<string, Child>()).current;

  if (!node) return null;

  const keysSeen = new Set<string>();

  let widgetChildren: Array<ChildNativeWidget | ChildWidget> = [];
  let lastNodeChild: ChildNode | null = null;

  iterDeco(
    node,
    innerDecorations,
    (widget, isNative, offset, index) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const widgetMarks = ((widget as any).type.spec.marks as Mark[]) ?? [];
      let key;
      if (isNative) {
        key = createKey(
          getInnerPos.current(),
          offset,
          "native-widget",
          reactKeys?.posToKey,
          widget,
          index
        );
        const child = {
          type: "native-widget",
          widget,
          marks: widgetMarks,
          offset,
          index,
          key,
        } as const;
        const prevChild = childMap.get(key);
        if (prevChild && areChildrenEqual(prevChild, child)) {
          prevChild.offset = offset;
        } else {
          childMap.set(key, child);
        }
        keysSeen.add(key);
      } else {
        key = createKey(
          getInnerPos.current(),
          offset,
          "widget",
          reactKeys?.posToKey,
          widget,
          index
        );
        const child = {
          type: "widget",
          widget: widget as ReactWidgetDecoration,
          marks: widgetMarks,
          offset,
          index,
          key,
        } as const;
        const prevChild = childMap.get(key);
        if (prevChild && areChildrenEqual(prevChild, child)) {
          prevChild.offset = offset;
        } else {
          childMap.set(key, child);
        }
        keysSeen.add(key);
      }
      const child = childMap.get(key) as ChildWidget | ChildNativeWidget;
      widgetChildren.push(child);
      adjustWidgetMarksForward(
        lastNodeChild,
        childMap.get(key) as ChildWidget | ChildNativeWidget
      );
    },
    (childNode, outerDeco, innerDeco, offset) => {
      const key = createKey(
        getInnerPos.current(),
        offset,
        "node",
        reactKeys?.posToKey
      );
      const child = {
        type: "node",
        node: childNode,
        marks: childNode.marks,
        innerDeco,
        outerDeco,
        offset,
        key,
      } as const;
      const prevChild = childMap.get(key);
      if (prevChild && areChildrenEqual(prevChild, child)) {
        prevChild.offset = offset;
        lastNodeChild = prevChild as ChildNode;
      } else {
        childMap.set(key, child);
        lastNodeChild = child;
      }
      keysSeen.add(key);
      adjustWidgetMarksBack(widgetChildren, lastNodeChild);
      widgetChildren = [];
    }
  );

  for (const key of childMap.keys()) {
    if (!keysSeen.has(key)) {
      childMap.delete(key);
    }
  }

  const children = Array.from(childMap.values()).sort(
    (a, b) => a.offset - b.offset
  );

  const childElements = createChildElements(children, getInnerPos);

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
      <SeparatorHackView getPos={getInnerPos} key="trailing-hack-img" />,
      <TrailingHackView getPos={getInnerPos} key="trailing-hack-br" />
    );
  }

  return <>{childElements}</>;
});
