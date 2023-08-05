import { Node } from "prosemirror-model";
import { DecorationSet } from "prosemirror-view";
import React, {
  ForwardedRef,
  ReactNode,
  cloneElement,
  createElement,
  forwardRef,
  useContext,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { NodeViewContext } from "../contexts/NodeViewContext.js";
import { ReactWidgetType } from "../decorations/ReactWidgetType.js";
import { NodeViewDesc, ViewDesc, iterDeco } from "../descriptors/ViewDesc.js";
import {
  DecorationSourceInternal,
  NonWidgetType,
} from "../prosemirror-internal/DecorationInternal.js";

import { MarkView } from "./MarkView.js";
import { NodeView } from "./NodeView.js";
import { TextNodeView } from "./TextNodeView.js";

type Props = {
  node: Node;
  contentEditable: boolean;
  decorations: DecorationSourceInternal;
};

export const DocNodeView = forwardRef(function DocNodeView(
  { node, contentEditable, decorations, ...props }: Props,
  ref: ForwardedRef<HTMLDivElement | null>
) {
  const { posToDesc, domToDesc } = useContext(NodeViewContext);
  const siblingDescriptors = useContext(ChildDescriptorsContext);
  const childDescriptors: ViewDesc[] = [];
  const innerRef = useRef<HTMLDivElement | null>(null);

  useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(
    ref,
    () => {
      return innerRef.current;
    },
    []
  );

  useLayoutEffect(() => {
    if (!innerRef.current) return;

    const firstChildDesc = childDescriptors[0];

    const desc = new NodeViewDesc(
      undefined,
      childDescriptors,
      node,
      [],
      DecorationSet.empty,
      innerRef.current,
      firstChildDesc?.dom.parentElement ?? null,
      innerRef.current,
      posToDesc,
      domToDesc
    );
    posToDesc.set(-1, desc);
    domToDesc.set(innerRef.current, desc);
    siblingDescriptors.push(desc);

    for (const childDesc of childDescriptors) {
      childDesc.parent = desc;
    }
  });

  const children: ReactNode[] = [];
  const innerPos = 0;

  iterDeco(
    node,
    decorations,
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

  return (
    <div
      ref={(element) => {
        innerRef.current = element;
        if (typeof ref === "function") {
          ref(element);
        } else if (ref) {
          ref.current = element;
        }
      }}
      contentEditable={contentEditable}
      suppressContentEditableWarning={true}
      {...props}
    >
      <ChildDescriptorsContext.Provider value={childDescriptors}>
        {children}
      </ChildDescriptorsContext.Provider>
    </div>
  );
});
