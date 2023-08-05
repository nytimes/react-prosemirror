import { DOMOutputSpec, Node } from "prosemirror-model";
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
import { ReactWidgetType } from "../decorations/ReactWidgetType.js";
import { NodeViewDesc, ViewDesc, iterDeco } from "../descriptors/ViewDesc.js";
import {
  DecorationInternal,
  DecorationSourceInternal,
  NonWidgetType,
} from "../prosemirror-internal/DecorationInternal.js";

import { MarkView } from "./MarkView.js";
import { NodeViewComponentProps } from "./NodeViewComponentProps.js";
import { OutputSpec } from "./OutputSpec.js";
import { TextNodeView } from "./TextNodeView.js";
import { TrailingHackView } from "./TrailingHackView.js";

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

  iterDeco(
    node,
    innerDecorations,
    (widget, offset, index) => {
      children.push(
        createElement((widget.type as ReactWidgetType).Component, {
          key: `${innerPos + offset}-${index}`,
        })
      );
    },
    (childNode, outerDeco, innerDeco, offset) => {
      const childPos = innerPos + offset;
      const nodeElement = childNode.isText ? (
        <ChildDescriptorsContext.Consumer>
          {(siblingDescriptors) => (
            <TextNodeView
              node={childNode}
              pos={childPos}
              siblingDescriptors={siblingDescriptors}
              decorations={outerDeco}
            />
          )}
        </ChildDescriptorsContext.Consumer>
      ) : (
        <NodeView
          node={childNode}
          pos={childPos}
          decorations={outerDeco}
          innerDecorations={innerDeco}
        />
      );

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
          return cloneElement(element, {
            className,
            ...attrs,
          });
        },

        childNode.marks.reduce(
          (element, mark) => <MarkView mark={mark}>{element}</MarkView>,
          nodeElement
        )
      );

      children.push(cloneElement(childElement, { key: childPos }));
    }
  );

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
