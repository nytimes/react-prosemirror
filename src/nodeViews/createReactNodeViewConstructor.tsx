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
import type { ComponentType, ReactNode } from "react";
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

type _ReactNodeView = Omit<NodeView, "update"> & {
  component: ComponentType<NodeViewComponentProps>;
};

// We use a mapped type to improve LSP information for this type.
// The language server will actually spell out the properties and
// corresponding types of the mapped type, rather than repeating
// the ugly Omit<...> & { component: ... } type above.
export type ReactNodeView = {
  [Property in keyof _ReactNodeView]: _ReactNodeView[Property];
};

export type ReactNodeViewConstructor = () => ReactNodeView;

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
  reactNodeViewConstructor: ReactNodeViewConstructor,
  registerElement: RegisterElement
) {
  function nodeViewConstructor(
    node: Node,
    editorView: EditorView,
    getPos: () => number,
    decorations: readonly Decoration[]
  ): NodeView {
    const reactNodeView = reactNodeViewConstructor();

    let componentRef: NodeViewWrapperRef | null = null;

    const { dom, contentDOM, component: ReactComponent } = reactNodeView;

    const ContentDOMElementType = contentDOM?.tagName.toLocaleLowerCase() as
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
      { initialState, getPos }: NodeViewWrapperProps,
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
        <ReactComponent
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
        </ReactComponent>
      );
    });

    NodeViewWrapper.displayName = `NodeView(${ReactComponent.displayName})`;

    const element = (
      <NodeViewWrapper
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
      ...reactNodeView,
      selectNode() {
        componentRef?.setIsSelected(true);
        reactNodeView.selectNode?.();
      },
      deselectNode() {
        componentRef?.setIsSelected(false);
        reactNodeView.deselectNode?.();
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
        reactNodeView.destroy?.();
      },
    };
  }

  return nodeViewConstructor;
}
