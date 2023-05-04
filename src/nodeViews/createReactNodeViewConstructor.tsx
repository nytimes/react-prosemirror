import type { Node } from "prosemirror-model";
import { Plugin, PluginKey } from "prosemirror-state";
import type {
  Decoration,
  DecorationSource,
  EditorView,
  NodeView,
  NodeViewConstructor,
} from "prosemirror-view";
import React, {
  Dispatch,
  SetStateAction,
  forwardRef,
  useContext,
  useImperativeHandle,
  useState,
} from "react";
import type { ComponentType, ReactNode } from "react";
import { createPortal } from "react-dom";

import {
  PORTAL_REGISTRY_ROOT_KEY,
  PortalRegistryContext,
  PortalRegistryKey,
} from "../contexts/PortalRegistryContext.js";

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

function findNearestRegistryKey(
  editorView: EditorView,
  pos: number
): PortalRegistryKey {
  const pluginState = portalTreePlugin.getState(editorView.state);
  if (!pluginState) return PORTAL_REGISTRY_ROOT_KEY;

  const { registry: positionRegistry } = pluginState;

  const $pos = editorView.state.doc.resolve(pos);

  for (let d = $pos.depth; d > 0; d--) {
    const parentPos = $pos.before(d);
    const parentKey = positionRegistry.get(parentPos);

    if (parentKey) return parentKey;
  }

  return PORTAL_REGISTRY_ROOT_KEY;
}

function generateRandomKey() {
  return Math.floor(Math.random() * 0xffffff).toString(16);
}

export const portalTreePlugin = new Plugin({
  key: new PluginKey("reactPmPortalTree"),
  state: {
    init(_, state) {
      const next = {
        registry: new Map<number, string>(),
        seed: generateRandomKey(),
      };
      state.doc.descendants((_, pos) => {
        const key = generateRandomKey();

        next.registry.set(pos, key);
      });
      return next;
    },
    apply(tr, value, _, newState) {
      if (!tr.docChanged) return value;

      const next = { ...value, registry: new Map<number, string>() };
      newState.doc.descendants((_, pos) => {
        const prevPos = tr.mapping.invert().map(pos);
        const prevKey = value.registry.get(prevPos);
        const key = prevKey ?? generateRandomKey();
        next.registry.set(pos, key);
      });
      return next;
    },
  },
});

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
      portalTreePlugin.getState(editorView.state)?.registry.get(getPos()) ??
      generateRandomKey();

    const initialPortalTreeSeed = portalTreePlugin.getState(
      editorView.state
    )?.seed;

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
      const childPortals = portalRegistry[key];

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

    // let unregisterElement: UnregisterElement | undefined;

    // ProseMirror hasn't assigned finished constructing the
    // node view descriptor tree yet, so attempts to ascend it
    // will fail until after the current call stack has finished
    // executing.
    //
    // Push registration onto the microtask queue so that it will
    // be executed at the end of the current event loop, after
    // ProseMirror has finished constructing the node view descriptor
    // tree.
    // const registrationMicrotask = () => {

    // };
    // ensureMicrotask(registrationMicrotask);
    const unregisterElement = registerElement(
      findNearestRegistryKey(editorView, getPos()),
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
        // If the plugin has been re-initialized since this
        // node view was created, we need to rebuild it
        // ALSO: we could technically keep this in sync
        // without destroying and rebuilding the node views!
        // I think we just need to pass the key as a "ref", and
        // in here, update the key, unregister the element, and re-register it.
        // This would still unmount and remount the React component though
        // so maybe not actually worth it?
        const nextPortalTreeSeed = portalTreePlugin.getState(
          editorView.state
        )?.seed;
        if (nextPortalTreeSeed !== initialPortalTreeSeed) {
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
        // if (unregisterElement) {
        unregisterElement();
        // } else {
        //   cancelMicrotask(registrationMicrotask);
        // }
        reactNodeView.destroy?.();
      },
    };
  }

  return nodeViewConstructor;
}
