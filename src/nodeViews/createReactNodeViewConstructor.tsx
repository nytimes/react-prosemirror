import type { Node } from "prosemirror-model";
import type { Decoration, EditorView, NodeView } from "prosemirror-view";
import React, {
  Dispatch,
  ReactHTML,
  SetStateAction,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import type { ComponentType, ElementType, ReactNode } from "react";
import { createPortal } from "react-dom";

export interface NodeViewComponentProps {
  decorations: readonly Decoration[];
  getPos: () => number;
  node: Node;
  children: ReactNode;
  isSelected: boolean;
}

interface NodeViewWrapperState {
  node: Node;
  decorations: readonly Decoration[];
  isSelected: boolean;
}

interface NodeViewWrapperProps {
  elementType: ElementType<NodeViewComponentProps>;
  contentDOMElementType?: keyof ReactHTML;
  editorView: EditorView;
  getPos: () => number;
  initialState: NodeViewWrapperState;
}

interface NodeViewWrapperRef {
  node: Node;
  contentDOMWrapper: HTMLElement | null;
  setNode: Dispatch<SetStateAction<Node>>;
  setDecorations: Dispatch<SetStateAction<readonly Decoration[]>>;
  setIsSelected: Dispatch<SetStateAction<boolean>>;
}

export type UnregisterElement = () => void;

export type RegisterElement = (
  ...args: Parameters<typeof createPortal>
) => UnregisterElement;

/**
 * Factory function for creating nodeViewConstructors that
 * render as React components.
 *
 * `ReactComponent` can be any React component that takes
 * `NodeViewComponentProps`. It will be passed all of the
 * arguments to the `nodeViewConstructor` except for
 * `editorView`. NodeView components that need access
 * directly to the EditorView should use the
 * `useEditorViewEvent` and `useEditorViewLayoutEffect`
 * hooks to ensure safe access.
 *
 * For contentful Nodes, the NodeView component will also
 * be passed a `children` prop containing an empty element.
 * ProseMirror will render content nodes into this element.
 */
export function createReactNodeViewConstructor(
  ReactComponent: ComponentType<NodeViewComponentProps>,
  registerElement: RegisterElement,
  innerConstructor: (
    node: Node,
    editorView: EditorView,
    getPos: () => number,
    decorations: readonly Decoration[]
  ) => Partial<Omit<NodeView, "update">> & Pick<NodeView, "dom">
) {
  function nodeViewConstructor(
    node: Node,
    editorView: EditorView,
    getPos: () => number,
    decorations: readonly Decoration[]
  ): NodeView {
    const innerNodeView = innerConstructor(
      node,
      editorView,
      getPos,
      decorations
    );

    let componentRef: NodeViewWrapperRef | null = null;

    const { dom, contentDOM } = innerNodeView;

    const contentDOMElementType = contentDOM?.tagName.toLocaleLowerCase() as
      | keyof ReactHTML
      | undefined;

    /**
     * Wrapper component to provide some imperative handles for updating
     * and re-rendering its child. Takes and renders an arbitrary ElementType
     * that expects NodeViewComponentProps as props.
     */
    const NodeViewWrapper = forwardRef<
      NodeViewWrapperRef,
      NodeViewWrapperProps
    >(function NodeViewWrapper(
      {
        elementType: ElementType,
        contentDOMElementType: ContentDOMElementType,
        initialState,
        getPos,
      }: NodeViewWrapperProps,
      ref
    ) {
      const [node, setNode] = useState<Node>(initialState.node);
      const [decorations, setDecorations] = useState<readonly Decoration[]>(
        initialState.decorations
      );
      const [isSelected, setIsSelected] = useState<boolean>(
        initialState.isSelected
      );

      const [contentDOMWrapper, setContentDOMWrapper] =
        useState<HTMLElement | null>(null);

      useImperativeHandle(
        ref,
        () => ({
          node,
          contentDOMWrapper: contentDOMWrapper,
          setNode,
          setDecorations,
          setIsSelected,
        }),
        [node, contentDOMWrapper]
      );

      return (
        <ElementType
          getPos={getPos}
          node={node}
          decorations={decorations}
          isSelected={isSelected}
        >
          {ContentDOMElementType && (
            <ContentDOMElementType
              // @ts-expect-error There are too many HTML tags, so typescript won't compute this union type
              ref={(contentDOMWrapper: HTMLElement | null) => {
                setContentDOMWrapper(contentDOMWrapper);
              }}
            />
          )}
        </ElementType>
      );
    });

    NodeViewWrapper.displayName = `NodeView(${ReactComponent.displayName})`;

    const element = (
      <NodeViewWrapper
        elementType={ReactComponent}
        contentDOMElementType={contentDOMElementType}
        initialState={{ node, decorations, isSelected: false }}
        editorView={editorView}
        getPos={getPos}
        ref={(c) => {
          componentRef = c;

          if (!componentRef || componentRef.node.isLeaf) return;

          const contentDOMWrapper = componentRef.contentDOMWrapper;
          if (
            !contentDOMWrapper ||
            !(contentDOMWrapper instanceof HTMLElement)
          ) {
            return;
          }

          // We always set contentDOM when !node.isLeaf, which is checked above
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          contentDOMWrapper.appendChild(contentDOM!);

          // Synchronize the ProseMirror selection to the DOM, because mounting the
          // component changes the DOM outside of a ProseMirror update.
          const { node } = componentRef;
          const pos = getPos();
          const end = pos + node.nodeSize;
          const { from, to } = editorView.state.selection;
          if (editorView.hasFocus() && pos < from && to < end) {
            // This call seems like it should be a no-op, given the editor already has
            // focus, but it causes ProseMirror to synchronize the DOM selection with
            // its state again, placing the DOM selection in a reasonable place within
            // the node.
            editorView.focus();
          }
        }}
      />
    );

    const unregisterElement = registerElement(
      element,
      dom as HTMLElement,
      Math.floor(Math.random() * 0xffffff).toString(16)
    );

    return {
      ignoreMutation(record: MutationRecord) {
        return !contentDOM?.contains(record.target);
      },
      ...innerNodeView,
      selectNode() {
        componentRef?.setIsSelected(true);
        innerNodeView.selectNode?.();
      },
      deselectNode() {
        componentRef?.setIsSelected(false);
        innerNodeView.deselectNode?.();
      },
      update(node: Node, decorations: readonly Decoration[]) {
        if (node.type === componentRef?.node.type) {
          componentRef?.setNode(node);
          componentRef?.setDecorations(decorations);
          return true;
        }
        return false;
      },
      destroy() {
        unregisterElement();
        innerNodeView.destroy?.();
      },
    };
  }

  return nodeViewConstructor;
}
