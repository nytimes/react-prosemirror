import { DOMOutputSpec, Node } from "prosemirror-model";
import {
  Command,
  EditorState,
  NodeSelection,
  Transaction,
} from "prosemirror-state";
import { Decoration, DecorationSet, DirectEditorProps } from "prosemirror-view";
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
import { NodeViewPositionsContext } from "../contexts/NodeViewPositionsContext.js";
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
    nodes.push(lastNode.cut(0, cut - curr));
    nodes.push(lastNode.cut(cut - curr));
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

export function EditorView({
  children,
  editable,
  keymap = {},
  nodeViews = {},
  dispatchTransaction: dispatchProp,
  decorations = DecorationSet.empty,
  defaultState,
  state: stateProp,
  ...mountProps
}: Props) {
  const [internalState, setInternalState] = useState<EditorState | null>(
    defaultState ?? null
  );

  const posToDOM = useRef(new Map<number, DOMNode>());
  posToDOM.current = new Map<number, DOMNode>();
  const domToPos = useRef(new Map<DOMNode, number>());
  domToPos.current = new Map<DOMNode, number>();

  // We always set internalState above if there's no state prop
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const state = stateProp ?? internalState!;

  const dispatchTransaction = useMemo(
    () =>
      dispatchProp ??
      ((tr: Transaction) => {
        setInternalState((prevState) => prevState?.apply(tr) ?? null);
      }),
    [dispatchProp]
  );

  const mountRef = useContentEditable(state, dispatchTransaction);

  useSyncSelection(state, dispatchTransaction, posToDOM, domToPos);

  const onKeyDown: KeyboardEventHandler = (event) => {
    if (keydownHandler(keymap)(state, dispatchTransaction, event.nativeEvent)) {
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
        const inlineDecorations = decorations
          .find(pos + offset + 1, pos + offset + 1 + childNode.nodeSize)
          .filter(
            (decoration) =>
              (decoration as Decoration & { inline: boolean }).inline
          );
        const textNodes: Node[] = makeCuts(
          inlineDecorations.flatMap((decoration) => [
            decoration.from - (pos + offset + 1),
            decoration.to - (pos + offset + 1),
          ]),
          childNode
        );

        let subOffset = 0;
        for (const textNode of textNodes) {
          const marked = wrapInMarks(
            <TextNodeWrapper pos={pos + offset + subOffset + 1}>
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
              (deco) =>
                deco.from <= pos + offset + 1 + subOffset &&
                deco.to >= pos + offset + 1 + subOffset + textNode.nodeSize
            ),
            true
          );
          childElements.push(decorated);
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

    const element = cloneElement(parentElement, undefined, ...childElements);

    const marked = wrapInMarks(element, node.marks, node.isInline);
    const nodeDecorations = decorations
      .find(pos, pos + node.nodeSize)
      .filter(
        (decoration) =>
          !(decoration as Decoration & { inline: boolean }).inline &&
          pos === decoration.from &&
          pos + node.nodeSize === decoration.to
      );
    const decorated = wrapInDecorations(marked, nodeDecorations, false);

    return <NodeWrapper pos={pos}>{decorated}</NodeWrapper>;
  }

  const content = buildReactTree(
    <div
      ref={mountRef}
      contentEditable={editable ? editable(state) : true}
      suppressContentEditableWarning={true}
      onKeyDown={onKeyDown}
      {...mountProps}
    ></div>,
    state.doc,
    -1,
    decorations
  );

  return (
    <LayoutGroup>
      <EditorViewContext.Provider
        value={{
          state,
          dispatchTransaction,
        }}
      >
        <NodeViewPositionsContext.Provider
          value={{
            mount: mountRef.current,
            posToDOM: posToDOM.current,
            domToPos: domToPos.current,
          }}
        >
          <>
            {content}
            {children}
          </>
        </NodeViewPositionsContext.Provider>
      </EditorViewContext.Provider>
    </LayoutGroup>
  );
}
