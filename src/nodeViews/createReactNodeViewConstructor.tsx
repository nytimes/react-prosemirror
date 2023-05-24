import type { Node } from "prosemirror-model";
import type {
  Decoration,
  DecorationSource,
  EditorView,
  NodeView,
  NodeViewConstructor,
} from "prosemirror-view";
import React, {
  Dispatch,
  ReactPortal,
  SetStateAction,
  forwardRef,
  useContext,
  useImperativeHandle,
  useState,
} from "react";
import type { ComponentType, ReactNode } from "react";
import { createPortal } from "react-dom";

import {
  PortalRegistryContext,
  PortalRegistryKey,
} from "../contexts/PortalRegistryContext.js";
import { useEditorEffect } from "../hooks/useEditorEffect.js";
import {
  REACT_NODE_VIEW,
  createRegistryKey,
  findNearestRegistryKey,
  reactNodeViewPlugin,
} from "../plugins/reactNodeViewPlugin.js";

import { phrasingContentTags } from "./phrasingContentTags.js";

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
  registrationKey: PortalRegistryKey,
  getPos: () => number,
  ...args: Parameters<typeof createPortal>
) => UnregisterElement;

type _ReactNodeView = NodeView & {
  component: ComponentType<NodeViewComponentProps>;
};

// We use a mapped type to improve LSP information for this type.
// The language server will actually spell out the properties and
// corresponding types of the mapped type, rather than repeating
// the ugly Omit<...> & { component: ... } type above.
export type ReactNodeView = {
  [Property in keyof _ReactNodeView]: _ReactNodeView[Property];
};

export type ReactNodeViewConstructor = (
  ...args: Parameters<NodeViewConstructor>
) => ReactNodeView;

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
    decorations: readonly Decoration[],
    innerDecorations: DecorationSource
  ): NodeView {
    const reactNodeView = reactNodeViewConstructor(
      node,
      editorView,
      getPos,
      decorations,
      innerDecorations
    );

    let componentRef: NodeViewWrapperRef | null = null;

    const { dom, contentDOM, component: ReactComponent } = reactNodeView;

    // Use a span if the provided contentDOM is in the "phrasing" content
    // category. Otherwise use a div. This is our best attempt at not
    // breaking the intended content model, for now.
    //
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Content_categories#phrasing_content
    const ContentDOMWrapper =
      contentDOM &&
      (phrasingContentTags.includes(contentDOM.tagName.toLocaleLowerCase())
        ? "span"
        : "div");

    // A key to uniquely identify this element to React
    const key =
      reactNodeViewPlugin.getState(editorView.state)?.get(getPos()) ??
      createRegistryKey();

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

      const portalRegistry = useContext(PortalRegistryContext);
      const childRegisteredPortals = portalRegistry[key];
      const [childPortals, setChildPortals] = useState<
        ReactPortal[] | undefined
      >(childRegisteredPortals?.map(({ portal }) => portal));

      useEditorEffect(() => {
        setChildPortals(
          childRegisteredPortals
            ?.sort((a, b) => a.getPos() - b.getPos())
            .map(({ portal }) => portal)
        );
      }, [childRegisteredPortals]);

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
          {childPortals}
          {ContentDOMWrapper && (
            <ContentDOMWrapper
              style={{ display: "contents" }}
              ref={(nextContentDOMWrapper) => {
                setContentDOMWrapper(nextContentDOMWrapper);
              }}
            />
          )}
        </ReactComponent>
      );
    });

    NodeViewWrapper.displayName = `NodeView(${
      ReactComponent.displayName ?? ReactComponent.name
    })`;

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
      findNearestRegistryKey(editorView, getPos()),
      getPos,
      element,
      dom as HTMLElement,
      key
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
      update(
        node: Node,
        decorations: readonly Decoration[],
        innerDecorations: DecorationSource
      ) {
        // If this node view's parent has been removed from the registry, we
        // need to rebuild it and its children with new registry keys
        const positionRegistry = reactNodeViewPlugin.getState(editorView.state);
        if (positionRegistry && key !== positionRegistry.get(getPos())) {
          return false;
        }

        if (
          reactNodeView.update?.(node, decorations, innerDecorations) === false
        ) {
          return false;
        }
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

  return Object.assign(nodeViewConstructor, { [REACT_NODE_VIEW]: true });
}
