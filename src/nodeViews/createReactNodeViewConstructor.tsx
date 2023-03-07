import type { Node } from "prosemirror-model";
import type { Decoration, EditorView, NodeView } from "prosemirror-view";
import React, {
  Context,
  Dispatch,
  ReactHTML,
  SetStateAction,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import type { ComponentType, ReactNode } from "react";
import type { createPortal } from "react-dom";
import { flushSync } from "react-dom-secondary";
import { createRoot } from "react-dom-secondary/client";

import { EditorViewContext } from "../contexts/EditorViewContext";

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
  contextValues: unknown[];
}

interface NodeViewWrapperProps {
  editorView: EditorView;
  getPos: () => number;
  initialState: NodeViewWrapperState;
  contexts: Context<unknown>[];
}

interface NodeViewWrapperRef {
  node: Node;
  contentDOMWrapper: HTMLElement | null;
  setNode: Dispatch<SetStateAction<Node>>;
  setDecorations: Dispatch<SetStateAction<readonly Decoration[]>>;
  setIsSelected: Dispatch<SetStateAction<boolean>>;
  setContextValues: (contextValues: unknown[]) => void;
}

export type UnregisterElement = () => void;

export type RegisterElement = (
  ...args: Parameters<typeof createPortal>
) => UnregisterElement;

export type ReactNodeView = {
  component: ComponentType<NodeViewComponentProps>;
  contentTag?: keyof ReactHTML;
};

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
  reactNodeView: ReactNodeView,
  contexts: Context<unknown>[],
  getContextValues: () => unknown[],
  subscribeToContextValues: (
    listener: (contextValues: unknown[]) => void
  ) => void
) {
  function nodeViewConstructor(
    node: Node,
    editorView: EditorView,
    getPos: () => number,
    decorations: readonly Decoration[]
  ): NodeView {
    let componentRef: NodeViewWrapperRef | null = null;

    const { contentTag: ContentDOMElementType, component: ReactComponent } =
      reactNodeView;

    /**
     * Wrapper component to provide some imperative handles for updating
     * and re-rendering its child. Takes and renders an arbitrary ElementType
     * that expects NodeViewComponentProps as props.
     */
    const NodeViewWrapper = forwardRef<
      NodeViewWrapperRef,
      NodeViewWrapperProps
    >(function NodeViewWrapper(
      { initialState, getPos, contexts }: NodeViewWrapperProps,
      ref
    ) {
      const [node, setNode] = useState<Node>(initialState.node);
      const [decorations, setDecorations] = useState<readonly Decoration[]>(
        initialState.decorations
      );
      const [isSelected, setIsSelected] = useState<boolean>(
        initialState.isSelected
      );
      const [contextValues, setContextValues] = useState<unknown[]>(
        initialState.contextValues
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
          setContextValues,
        }),
        [node, contentDOMWrapper]
      );

      return contexts.reduce(
        (acc, context, i) => (
          <context.Provider value={contextValues[i]}>{acc}</context.Provider>
        ),
        <EditorViewContext.Provider
          // FIX: This editorState value actually is not correct :P
          value={{ editorView, editorState: editorView.state }}
        >
          <ReactComponent
            getPos={getPos}
            node={node}
            decorations={decorations}
            isSelected={isSelected}
          >
            {ContentDOMElementType && (
              <ContentDOMElementType
                // @ts-expect-error There are too many HTML tags, so typescript won't compute this union type
                ref={(nextContentDOMWrapper: HTMLElement | null) => {
                  setContentDOMWrapper(nextContentDOMWrapper);
                }}
              />
            )}
          </ReactComponent>
        </EditorViewContext.Provider>
      );
    });

    NodeViewWrapper.displayName = `NodeView(${
      ReactComponent.displayName ?? ReactComponent.name
    })`;

    let renderedContentDOM: HTMLElement | null = null;

    const element = (
      <NodeViewWrapper
        initialState={{
          node,
          decorations,
          isSelected: false,
          contextValues: getContextValues(),
        }}
        editorView={editorView}
        getPos={getPos}
        contexts={contexts}
        ref={(c) => {
          componentRef = c;

          if (!componentRef) return;

          subscribeToContextValues(componentRef.setContextValues);

          if (componentRef.node.isLeaf) return;

          renderedContentDOM = componentRef.contentDOMWrapper;
          if (
            !renderedContentDOM ||
            !(renderedContentDOM instanceof HTMLElement)
          ) {
            return;
          }

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

    const container = document.createElement("div");
    const root = createRoot(container as HTMLElement);
    flushSync(() => {
      root.render(element);
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const dom = container.firstChild!;

    return {
      ignoreMutation(record: MutationRecord) {
        return !renderedContentDOM?.contains(record.target);
      },
      ...reactNodeView,
      selectNode() {
        componentRef?.setIsSelected(true);
      },
      deselectNode() {
        componentRef?.setIsSelected(false);
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
        container.appendChild(dom);
        root.unmount();
      },
      dom,
      contentDOM: renderedContentDOM,
    };
  }

  return nodeViewConstructor;
}
