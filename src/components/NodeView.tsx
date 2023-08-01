import { DOMOutputSpec, Node } from "prosemirror-model";
import { NodeSelection } from "prosemirror-state";
import { DecorationSet } from "prosemirror-view";
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
  const nodeDomRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!domRef.current) return;

    const firstChildDesc = childDescriptors[0];

    const desc = new NodeViewDesc(
      undefined,
      node,
      [],
      DecorationSet.empty,
      domRef.current,
      firstChildDesc?.dom.parentElement ?? null,
      nodeDomRef.current ?? domRef.current,
      posToDesc,
      domToDesc
    );
    desc.children = childDescriptors;
    posToDesc.set(pos, desc);
    domToDesc.set(domRef.current, desc);
    siblingDescriptors.push(desc);

    for (const childDesc of childDescriptors) {
      childDesc.parent = desc;
    }
  });

  const content: ReactNode[] = [];
  const innerPos = pos + 1;
  iterDeco(
    node,
    innerDecorations,
    (widget, offset, index) => {
      content.push(
        createElement((widget.type as ReactWidgetType).Component, {
          key: `${innerPos + offset}-${index}`,
        })
      );
    },
    (childNode, outerDeco, innerDeco, offset) => {
      const childPos = innerPos + offset;
      if (childNode.isText) {
        content.push(
          <ChildDescriptorsContext.Consumer key={childPos}>
            {(siblingDescriptors) => (
              <TextNodeView
                node={childNode}
                pos={childPos}
                siblingDescriptors={siblingDescriptors}
                decorations={outerDeco}
              />
            )}
          </ChildDescriptorsContext.Consumer>
        );
      } else {
        content.push(
          <NodeView
            key={childPos}
            node={childNode}
            pos={childPos}
            decorations={outerDeco}
            innerDecorations={innerDeco}
          />
        );
      }
    }
  );

  if (!content.length) {
    content.push(<TrailingHackView key={innerPos} pos={innerPos} />);
  }

  const children = (
    <ChildDescriptorsContext.Provider value={childDescriptors}>
      {content}
    </ChildDescriptorsContext.Provider>
  );

  let element: JSX.Element | null = null;

  const Component:
    | ForwardRefExoticComponent<
        NodeViewComponentProps & RefAttributes<HTMLElement>
      >
    | undefined = nodeViews[node.type.name];

  if (Component) {
    element = (
      <Component
        ref={domRef}
        node={node}
        pos={pos}
        decorations={decorations}
        innerDecorations={innerDecorations}
        isSelected={
          state.selection instanceof NodeSelection &&
          state.selection.node === node
        }
        {...props}
      >
        {children}
      </Component>
    );
  }

  const outputSpec: DOMOutputSpec | undefined = node.type.spec.toDOM?.(node);

  if (outputSpec) {
    element = (
      <OutputSpec ref={domRef} outputSpec={outputSpec} {...props}>
        {children}
      </OutputSpec>
    );
  }

  if (!element) {
    throw new Error(`Node spec for ${node.type.name} is missing toDOM`);
  }

  const wrapDecorations: DecorationInternal[] = [];
  for (const decoration of decorations) {
    if ((decoration.type as NonWidgetType).attrs.nodeName) {
      wrapDecorations.push(decoration);
    } else {
      const {
        class: className,
        style: _,
        ...attrs
      } = (decoration.type as NonWidgetType).attrs;
      element = cloneElement(element, {
        className,
        ...attrs,
      });
    }
  }

  return wrapDecorations.reduce(
    (element, deco) => {
      const {
        nodeName,
        class: className,
        style: _,
        ...attrs
      } = (deco.type as NonWidgetType).attrs;

      return createElement(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        nodeName!,
        {
          className,
          ...attrs,
        },
        element
      );
    },

    node.marks.reduce(
      (element, mark) => (
        <MarkView ref={nodeDomRef} mark={mark}>
          {element}
        </MarkView>
      ),
      element
    )
  );
}
