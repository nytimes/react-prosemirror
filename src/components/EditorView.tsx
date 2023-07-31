import { keydownHandler } from "prosemirror-keymap";
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

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { EditorViewContext } from "../contexts/EditorViewContext.js";
import { LayoutGroup } from "../contexts/LayoutGroup.js";
import { NodeViewDescriptorsContext } from "../contexts/NodeViewPositionsContext.js";
import { ReactWidgetType } from "../decorations/ReactWidgetType.js";
import { NodeViewDesc, ViewDesc } from "../descriptors/ViewDesc.js";
import { useContentEditable } from "../hooks/useContentEditable.js";
import { useSyncSelection } from "../hooks/useSyncSelection.js";
import {
  renderSpec,
  wrapInDecorations,
  wrapInMarks,
} from "../nodeViews/render.js";
import { EditorViewInternal } from "../prosemirror-internal/EditorViewInternal.js";
import { DOMNode, DOMSelection } from "../prosemirror-internal/dom.js";
import {
  coordsAtPos,
  endOfTextblock,
  posAtCoords,
} from "../prosemirror-internal/domcoords.js";

import { NodeWrapper } from "./NodeWrapper.js";
import { TextNodeWrapper } from "./TextNodeWrapper.js";
import { TrailingHackWrapper } from "./TrailingHackWrapper.js";

function makeCuts(cuts: number[], node: Node) {
  const sortedCuts = cuts.sort((a, b) => a - b);
  const nodes: [Node, ...Node[]] = [node];
  let curr = 0;
  for (const cut of sortedCuts) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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

  const posToDesc = useRef(new Map<number, ViewDesc>());
  posToDesc.current = new Map();
  const domToDesc = useRef(new Map<DOMNode, ViewDesc>());
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
    // @ts-expect-error TODO: Reconcile this type with the EditorView class
    if (keydownHandler(keymap)(editorViewRef.current, event.nativeEvent)) {
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
      childElements.push(<TrailingHackWrapper pos={pos + 1} />);
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
            <ChildDescriptorsContext.Consumer key={textNodeStart}>
              {(siblingDescriptors) => (
                <TextNodeWrapper
                  siblingDescriptors={siblingDescriptors}
                  pos={textNodeStart}
                  node={textNode}
                >
                  {/* Text nodes always have text */}
                  {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                  {textNode.text!}
                </TextNodeWrapper>
              )}
            </ChildDescriptorsContext.Consumer>,
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
        : renderSpec(outputSpec, pos + offset + 1);

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
    const wrapped = (
      <NodeWrapper key={pos} pos={pos} node={node}>
        {decorated}
      </NodeWrapper>
    );

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

  // This is only safe to use in effects/layout effects or
  // event handlers!
  const editorViewAPI = useMemo<EditorViewInternal>(
    // @ts-expect-error - EditorView API not fully implemented yet
    () => ({
      /* Start TODO */
      dragging: null,
      composing: false,
      someProp: () => {
        /* */
      },
      focus() {
        /* */
      },
      /* End TODO */
      get dom() {
        if (!mountRef.current) {
          throw new Error(
            "The EditorView should only be accessed in an effect or event handler."
          );
        }
        return mountRef.current;
      },
      get docView() {
        if (!mountRef.current || !domToDesc.current.get(mountRef.current)) {
          throw new Error(
            "The EditorView should only be accessed in an effect or event handler."
          );
        }
        return domToDesc.current.get(mountRef.current) as NodeViewDesc;
      },
      editable,
      state,
      dispatch,
      hasFocus() {
        return this.root.activeElement == this.dom;
      },
      get root(): Document | ShadowRoot {
        const cached = this._root;
        if (cached == null)
          for (
            let search = this.dom.parentNode;
            search;
            search = search.parentNode
          ) {
            if (
              search.nodeType == 9 ||
              (search.nodeType == 11 && (search as any).host)
            ) {
              if (!(search as any).getSelection)
                Object.getPrototypeOf(search).getSelection = () =>
                  (search as DOMNode).ownerDocument!.getSelection();
              return (this._root = search as Document | ShadowRoot);
            }
          }
        return cached || document;
      },
      domSelection(): DOMSelection {
        return (this.root as Document).getSelection()!;
      },
      props: {
        editable: editableProp,
        state: stateProp ?? defaultState,
        dispatchTransaction: dispatchProp,
      },
      nodeDOM(pos) {
        return posToDesc.current.get(pos)?.dom ?? null;
      },
      domAtPos(pos, side = 0) {
        return this.docView.domFromPos(pos, side);
      },
      coordsAtPos(pos, side = 1) {
        // @ts-expect-error TODO: Reconcile this type with the EditorView class
        return coordsAtPos(this, pos, side);
      },
      posAtCoords(coords) {
        // @ts-expect-error TODO: Reconcile this type with the EditorView class
        return posAtCoords(this, coords);
      },
      posAtDOM(node: DOMNode, offset: number, bias = -1): number {
        const pos = this.docView.posFromDOM(node, offset, bias);
        if (pos == null)
          throw new RangeError("DOM position not inside the editor");
        return pos;
      },
      endOfTextblock(
        dir: "up" | "down" | "left" | "right" | "forward" | "backward",
        state?: EditorState
      ): boolean {
        // @ts-expect-error TODO: Reconcile this type with the EditorView class
        return endOfTextblock(this, state || this.state, dir);
      },
    }),
    [
      mountRef,
      posToDesc,
      domToDesc,
      editable,
      state,
      dispatch,
      editableProp,
      stateProp,
      defaultState,
      dispatchProp,
    ]
  );

  const editorViewRef = useRef(editorViewAPI);
  editorViewRef.current = editorViewAPI;

  return (
    <LayoutGroup>
      <EditorViewContext.Provider value={editorViewRef}>
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
