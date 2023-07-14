import { keydownHandler } from "prosemirror-keymap";
import { Node as ProseMirrorNode } from "prosemirror-model";
import {
  Command,
  EditorState,
  NodeSelection,
  Transaction,
} from "prosemirror-state";
import {
  Decoration,
  DirectEditorProps,
  EditorView as EditorViewPM,
} from "prosemirror-view";
import React, {
  ComponentType,
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
import { useContentEditable } from "../hooks/useContentEditable.js";
import { useSyncSelection } from "../hooks/useSyncSelection.js";
import { renderSpec, wrapInMarks } from "../nodeViews/render.js";

import { NodeWrapper } from "./NodeWrapper.js";
import { TextNodeWrapper } from "./TextNodeWrapper.js";

export type NodeViewComponentProps = {
  decorations: readonly Decoration[];
  node: ProseMirrorNode;
  children?: ReactNode | ReactNode[];
  isSelected: boolean;
  pos: number;
};

type EditorStateProps =
  | {
      state: EditorState;
    }
  | {
      defaultState: EditorState;
    };

export type EditorProps = Omit<DirectEditorProps, "state" | "nodeViews"> &
  EditorStateProps & {
    keymap?: { [key: string]: Command };
    nodeViews?: { [nodeType: string]: ComponentType<NodeViewComponentProps> };
  };

export type Props = EditorProps & {
  children?: ReactNode | null;
};

export function EditorView({
  children,
  editable,
  keymap = {},
  nodeViews = {},
  ...editorProps
}: Props) {
  const [internalState, setInternalState] = useState<EditorState | null>(
    "defaultState" in editorProps ? editorProps.defaultState : null
  );

  const posToDOM = useRef(new Map<number, Element | Text>());
  posToDOM.current = new Map<number, Element | Text>();
  const domToPos = useRef(new Map<Element | Text, number>());
  domToPos.current = new Map<Element | Text, number>();

  // We always set internalState above if there's no state prop
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const state = "state" in editorProps ? editorProps.state : internalState!;

  const dispatchTransaction = useMemo(
    () =>
      editorProps.dispatchTransaction ??
      ((tr: Transaction) => {
        setInternalState((prevState) => prevState?.apply(tr) ?? null);
      }),
    [editorProps.dispatchTransaction]
  );

  const mountRef = useContentEditable(state, dispatchTransaction);

  useSyncSelection(state, dispatchTransaction, posToDOM, domToPos);

  const onKeyDown: KeyboardEventHandler = (event) => {
    if (
      keydownHandler(keymap)(
        { state: state, dispatch: dispatchTransaction } as EditorViewPM,
        event.nativeEvent
      )
    ) {
      event.preventDefault();
    }
  };

  function buildReactTree(
    parentElement: JSX.Element,
    node: ProseMirrorNode,
    pos: number
  ) {
    const childElements: ReactNode[] = [];
    if (node.childCount === 0 && node.isTextblock) {
      childElements.push(<br />);
    }
    node.forEach((childNode, offset) => {
      if (childNode.isText && childNode.text !== undefined) {
        const element = wrapInMarks(
          <TextNodeWrapper pos={pos + offset + 1}>
            {childNode.text}
          </TextNodeWrapper>,
          childNode.marks,
          childNode.isInline
        );

        childElements.push(element);

        return false;
      }

      const outputSpec = childNode.type.spec.toDOM?.(childNode);
      if (!outputSpec)
        throw new Error(
          `Node spec for ${childNode.type.name} is missing toDOM`
        );

      const Component = nodeViews[childNode.type.name];

      let element = Component
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
        element = buildReactTree(element, childNode, pos + offset + 1);
      }

      childElements.push(element);

      return isValidElement(element);
    });

    const element = cloneElement(parentElement, undefined, ...childElements);

    const markedElement = wrapInMarks(element, node.marks, node.isInline);

    return <NodeWrapper pos={pos}>{markedElement}</NodeWrapper>;
  }

  const content = buildReactTree(
    <div
      ref={mountRef}
      contentEditable={editable ? editable(state) : true}
      suppressContentEditableWarning={true}
      onKeyDown={onKeyDown}
    ></div>,
    state.doc,
    -1
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
