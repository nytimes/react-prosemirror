import { DOMOutputSpec, Node } from "prosemirror-model";
import {
  Command,
  EditorState,
  NodeSelection,
  Transaction,
} from "prosemirror-state";
import { Decoration, DecorationSet, DirectEditorProps } from "prosemirror-view";
import type { EditorView as EditorViewT } from "prosemirror-view";
import React, {
  ComponentType,
  DetailedHTMLProps,
  HTMLAttributes,
  KeyboardEventHandler,
  ReactNode,
  cloneElement,
  createElement,
  isValidElement,
  useMemo,
  useRef,
  useState,
} from "react";

import { EditorViewContext } from "../contexts/EditorViewContext.js";
import { LayoutGroup } from "../contexts/LayoutGroup.js";
import {
  NodeViewDescriptor,
  NodeViewDescriptorsContext,
} from "../contexts/NodeViewPositionsContext.js";
import { ReactWidgetType } from "../decorations/ReactWidgetType.js";
import { DOMNode } from "../dom.js";
import { useContentEditable } from "../hooks/useContentEditable.js";
import { useSyncSelection } from "../hooks/useSyncSelection.js";
import { keydownHandler } from "../keydownHandler.js";
import {
  renderSpec,
  wrapInDecorations,
  wrapInMarks,
} from "../nodeViews/render.js";

import { NodeWrapper } from "./NodeWrapper.js";
import { TextNodeWrapper } from "./TextNodeWrapper.js";

function makeCuts(cuts: number[], node: Node) {
  const sortedCuts = cuts.sort((a, b) => a - b);
  const nodes: [Node, ...Node[]] = [node];
  let curr = 0;
  for (const cut of sortedCuts) {
    const lastNode = nodes.pop()!;
    if (cut - curr !== 0) {
      nodes.push(lastNode.cut(0, cut - curr));
    }
    if (lastNode.nodeSize > cut - curr) {
      nodes.push(lastNode.cut(cut - curr));
    }
    curr = cut;
  }
  return nodes;
}

export type NodeViewComponentProps = {
  decorations: readonly Decoration[];
  node: Node;
  children?: ReactNode | ReactNode[];
  isSelected: boolean;
  pos: number;
};

type EditorStateProps =
  | {
      state: EditorState;
      defaultState?: never;
    }
  | {
      state?: never;
      defaultState: EditorState;
    };

export type EditorProps = Omit<
  DirectEditorProps,
  "state" | "nodeViews" | "decorations"
> &
  EditorStateProps & {
    keymap?: { [key: string]: Command };
    nodeViews?: { [nodeType: string]: ComponentType<NodeViewComponentProps> };
    decorations?: DecorationSet;
  };

export type Props = EditorProps &
  DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;

export function EditorView(props: Props) {
  const {
    children,
    editable: editableProp,
    keymap = {},
    nodeViews = {},
    dispatchTransaction: dispatchProp,
    decorations = DecorationSet.empty,
    defaultState,
    state: stateProp,
    ...mountProps
  } = props;

  const [internalState, setInternalState] = useState<EditorState | null>(
    defaultState ?? null
  );

  const posToDesc = useRef(new Map<number, NodeViewDescriptor>());
  posToDesc.current = new Map();
  const domToDesc = useRef(new Map<DOMNode, NodeViewDescriptor>());
  domToDesc.current = new Map();

  // We always set internalState above if there's no state prop
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const state = stateProp ?? internalState!;

  const dispatch = useMemo(
    () =>
      dispatchProp ??
      ((tr: Transaction) => {
        setInternalState((prevState) => prevState?.apply(tr) ?? null);
      }),
    [dispatchProp]
  );

  const mountRef = useContentEditable(state, dispatch);

  useSyncSelection(state, dispatch, posToDesc, domToDesc);

  const onKeyDown: KeyboardEventHandler = (event) => {
    if (keydownHandler(keymap)(state, dispatch, event.nativeEvent)) {
      event.preventDefault();
    }
  };

  function buildReactTree(
    parentElement: JSX.Element,
    node: Node,
    pos: number,
    decorations: DecorationSet
  ) {
    const childElements: ReactNode[] = [];
    if (node.childCount === 0 && node.isTextblock) {
      childElements.push(<br />);
    }
    node.forEach((childNode, offset) => {
      if (childNode.isText) {
        const localDecorations = decorations.find(
          pos + offset + 1,
          pos + offset + 1 + childNode.nodeSize
        );
        const inlineDecorations = localDecorations.filter(
          (decoration) =>
            (decoration as Decoration & { inline: boolean }).inline
        );
        const widgetDecorations = localDecorations.filter(
          (decoration) =>
            (decoration as Decoration & { type: ReactWidgetType })
              .type instanceof ReactWidgetType
        );
        const textNodes: Node[] = makeCuts(
          inlineDecorations
            .flatMap((decoration) => [
              decoration.from - (pos + offset + 1),
              decoration.to - (pos + offset + 1),
            ])
            .concat(
              widgetDecorations.map(
                (decoration) => decoration.from - (pos + offset + 1)
              )
            ),
          childNode
        );

        let subOffset = 0;
        for (const textNode of textNodes) {
          const textNodeStart = pos + offset + subOffset + 1;
          const textNodeEnd = pos + offset + subOffset + 1 + textNode.nodeSize;
          const marked = wrapInMarks(
            <TextNodeWrapper pos={textNodeStart}>
              {/* Text nodes always have text */}
              {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
              {textNode.text!}
            </TextNodeWrapper>,
            textNode.marks,
            textNode.isInline
          );
          const decorated = wrapInDecorations(
            marked,
            inlineDecorations.filter(
              (deco) => deco.from <= textNodeStart && deco.to >= textNodeEnd
            ),
            true
          );

          childElements.push(decorated);

          widgetDecorations.forEach((decoration) => {
            if (decoration.from !== textNodeEnd) return;

            const decorationType = (
              decoration as Decoration & { type: ReactWidgetType }
            ).type;

            childElements.push(<decorationType.Component />);
          });

          subOffset += textNode.nodeSize;
        }

        return false;
      }

      const outputSpec: DOMOutputSpec | undefined =
        childNode.type.spec.toDOM?.(childNode);
      if (!outputSpec)
        throw new Error(
          `Node spec for ${childNode.type.name} is missing toDOM`
        );

      const Component: ComponentType<NodeViewComponentProps> | undefined =
        nodeViews[childNode.type.name];

      let element: ReactNode = Component
        ? createElement(Component, {
            node: childNode,
            decorations: [],
            // TODO: This is how I'm reading the prosemirror-view code,
            // but I would have expected this to be broader?
            isSelected:
              state.selection instanceof NodeSelection &&
              state.selection.node === node,
            pos: pos + offset + 1,
          })
        : renderSpec(outputSpec);

      if (isValidElement(element)) {
        element = buildReactTree(
          element,
          childNode,
          pos + offset + 1,
          decorations
        );
      }

      childElements.push(element);

      return isValidElement(element);
    });

    const localDecorations = decorations.find(pos, pos + node.nodeSize);
    const nodeDecorations = localDecorations.filter(
      (decoration) =>
        !(decoration as Decoration & { inline: boolean }).inline &&
        pos === decoration.from &&
        pos + node.nodeSize === decoration.to
    );
    const widgetDecorations = localDecorations.filter(
      (decoration) =>
        (decoration as Decoration & { type: ReactWidgetType }).type instanceof
        ReactWidgetType
    );

    widgetDecorations.forEach((decoration) => {
      if (!node.isLeaf && decoration.from !== pos + 1) return;

      const decorationType = (
        decoration as Decoration & { type: ReactWidgetType }
      ).type;

      childElements.unshift(<decorationType.Component />);
    });

    const element = cloneElement(parentElement, undefined, ...childElements);

    const marked = wrapInMarks(element, node.marks, node.isInline);

    const decorated = wrapInDecorations(marked, nodeDecorations, false);
    const wrapped = <NodeWrapper pos={pos}>{decorated}</NodeWrapper>;

    const elements = [wrapped];

    widgetDecorations.forEach((decoration, index, array) => {
      if (decoration.from !== pos + node.nodeSize) return;

      const decorationType = (
        decoration as Decoration & { type: ReactWidgetType }
      ).type;

      elements.push(<decorationType.Component />);

      array.splice(index, 1);
    });

    return <>{elements}</>;
  }

  const editable = editableProp ? editableProp(state) : true;

  const content = buildReactTree(
    <div
      ref={mountRef}
      contentEditable={editable}
      suppressContentEditableWarning={true}
      onKeyDown={onKeyDown}
      {...mountProps}
    ></div>,
    state.doc,
    -1,
    decorations
  );

  const contextValue = useMemo<EditorViewT>(
    // @ts-expect-error - EditorView API not fully implemented yet
    () => ({
      dom: mountRef.current!,
      editable,
      state,
      dispatch,
      props: {
        editable: editableProp,
        state: stateProp ?? defaultState,
        dispatchTransaction: dispatchProp,
      },
      nodeDOM(pos) {
        return posToDesc.current.get(pos)?.dom ?? null;
      },
    }),
    [editable, editableProp, state, stateProp, dispatch, dispatchProp]
  );

  return (
    <LayoutGroup>
      <EditorViewContext.Provider value={contextValue}>
        <NodeViewDescriptorsContext.Provider
          value={{
            mount: mountRef.current,
            posToDesc: posToDesc.current,
            domToDesc: domToDesc.current,
          }}
        >
          <>
            {content}
            {children}
          </>
        </NodeViewDescriptorsContext.Provider>
      </EditorViewContext.Provider>
    </LayoutGroup>
  );
}
