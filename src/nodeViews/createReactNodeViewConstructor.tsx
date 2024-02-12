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

import { NodeViewsContext } from "../contexts/NodeViewsContext.js";
import { useEditorEffect } from "../hooks/useEditorEffect.js";
import { NodePosProvider } from "../hooks/useNodePos.js";
import {
  NodeKey,
  ROOT_NODE_KEY,
  createNodeKey,
  reactPluginKey,
} from "../plugins/react.js";

import { phrasingContentTags } from "./phrasingContentTags.js";

export interface NodeViewComponentProps {
  decorations: readonly Decoration[];
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
  initialState: NodeViewWrapperState;
}

interface NodeViewWrapperRef {
  node: Node;
  contentDOMWrapper: HTMLElement | null;
  contentDOMParent: HTMLElement | null;
  setNode: Dispatch<SetStateAction<Node>>;
  setDecorations: Dispatch<SetStateAction<readonly Decoration[]>>;
  setIsSelected: Dispatch<SetStateAction<boolean>>;
}

export type UnregisterElement = () => void;

export type RegisterPortal = (
  view: EditorView,
  getPos: () => number,
  portal: ReactPortal
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
 * Identifies a node view constructor as having been created
 * by @nytimes/react-prosemirror
 */
export const REACT_NODE_VIEW = Symbol("react node view");

/**
 * Searches upward for the nearest node with a node key,
 * returning the first node key it finds associated with
 * a React node view.
 *
 * Returns the root key if no ancestor nodes have node keys.
 */
export function findNodeKeyUp(editorView: EditorView, pos: number): NodeKey {
  const pluginState = reactPluginKey.getState(editorView.state);
  if (!pluginState) return ROOT_NODE_KEY;

  const $pos = editorView.state.doc.resolve(pos);

  for (let d = $pos.depth; d > 0; d--) {
    const ancestorNodeTypeName = $pos.node(d).type.name;
    const ancestorNodeView = editorView.props.nodeViews?.[
      ancestorNodeTypeName
    ] as (NodeViewConstructor & { [REACT_NODE_VIEW]?: true }) | undefined;

    if (!ancestorNodeView?.[REACT_NODE_VIEW]) continue;

    const ancestorPos = $pos.before(d);
    const ancestorKey = pluginState.posToKey.get(ancestorPos);

    if (ancestorKey) return ancestorKey;
  }

  return ROOT_NODE_KEY;
}

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
  registerPortal: RegisterPortal
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

    const reactPluginState = reactPluginKey.getState(editorView.state);
    if (!reactPluginState)
      throw new Error(
        "Can't find the react() ProseMirror plugin, required for useNodeViews(). Was it added to the EditorState.plugins?"
      );
    const nodeKey = reactPluginState.posToKey.get(getPos()) ?? createNodeKey();

    /**
     * Wrapper component to provide some imperative handles for updating
     * and re-rendering its child. Takes and renders an arbitrary ElementType
     * that expects NodeViewComponentProps as props.
     */
    const NodeViewWrapper = forwardRef<
      NodeViewWrapperRef,
      NodeViewWrapperProps
    >(function NodeViewWrapper({ initialState }: NodeViewWrapperProps, ref) {
      const [node, setNode] = useState<Node>(initialState.node);
      const [decorations, setDecorations] = useState<readonly Decoration[]>(
        initialState.decorations
      );
      const [isSelected, setIsSelected] = useState<boolean>(
        initialState.isSelected
      );

      const nodeViews = useContext(NodeViewsContext);
      const childNodeViews = nodeViews[nodeKey];
      const [childNodeViewPortals, setChildNodeViewPortals] = useState(
        childNodeViews?.map(({ portal }) => portal)
      );

      // `getPos` is technically derived from the EditorView
      // state, so it's not safe to call until after the EditorView
      // has been updated
      useEditorEffect(() => {
        setChildNodeViewPortals(
          childNodeViews
            ?.sort((a, b) => a.getPos() - b.getPos())
            .map(({ portal }) => portal)
        );
      }, [childNodeViews]);

      const [contentDOMWrapper, setContentDOMWrapper] =
        useState<HTMLElement | null>(null);

      const [contentDOMParent, setContentDOMParent] =
        useState<HTMLElement | null>(null);

      useImperativeHandle(
        ref,
        () => ({
          node,
          contentDOMWrapper: contentDOMWrapper,
          contentDOMParent: contentDOMParent,
          setNode,
          setDecorations,
          setIsSelected,
        }),
        [node, contentDOMWrapper, contentDOMParent]
      );
      return (
        <NodePosProvider nodeKey={nodeKey}>
          <ReactComponent
            node={node}
            decorations={decorations}
            isSelected={isSelected}
          >
            {childNodeViewPortals}
            {ContentDOMWrapper && (
              <ContentDOMWrapper
                style={{ display: "contents" }}
                ref={(nextContentDOMWrapper) => {
                  setContentDOMWrapper(nextContentDOMWrapper);
                  // we preserve a reference to the contentDOMWrapper'
                  // parent so that later we can reassemble the DOM hierarchy
                  // React expects when cleaning up the ContentDOMWrapper element
                  if (nextContentDOMWrapper?.parentNode) {
                    setContentDOMParent(
                      nextContentDOMWrapper.parentNode as HTMLElement
                    );
                  }
                }}
              />
            )}
          </ReactComponent>
        </NodePosProvider>
      );
    });

    NodeViewWrapper.displayName = `NodeView(${
      ReactComponent.displayName ?? ReactComponent.name
    })`;

    const element = (
      <NodeViewWrapper
        initialState={{ node, decorations, isSelected: false }}
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

    const portal = createPortal(element, dom as HTMLElement, nodeKey);

    const unregisterPortal = registerPortal(editorView, getPos, portal);

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
        const positionRegistry = reactPluginKey.getState(editorView.state);
        if (
          positionRegistry &&
          nodeKey !== positionRegistry.posToKey.get(getPos())
        ) {
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
        // React expects the contentDOMParent to be a child of the
        // DOM element where the portal was mounted, but in some situations
        // contenteditable may have already detached the contentDOMParent
        // from the DOM. Here we attempt to reassemble the DOM that React
        // expects when cleaning up the portal.
        if (componentRef?.contentDOMParent) {
          this.dom.appendChild(componentRef.contentDOMParent);
        }
        unregisterPortal();
        reactNodeView.destroy?.();
      },
    };
  }

  return Object.assign(nodeViewConstructor, { [REACT_NODE_VIEW]: true });
}
