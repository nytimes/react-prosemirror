import type { Node } from "prosemirror-model";
import type { Decoration, DecorationSource, EditorView, NodeView, NodeViewConstructor } from "prosemirror-view";
import { ReactPortal } from "react";
import type { ComponentType, ReactNode } from "react";
import { NodeKey } from "../plugins/react.js";
export interface NodeViewComponentProps {
    decorations: readonly Decoration[];
    node: Node;
    children: ReactNode;
    isSelected: boolean;
}
export type UnregisterElement = () => void;
export type RegisterPortal = (view: EditorView, getPos: () => number, portal: ReactPortal) => UnregisterElement;
type _ReactNodeView = NodeView & {
    component: ComponentType<NodeViewComponentProps>;
};
export type ReactNodeView = {
    [Property in keyof _ReactNodeView]: _ReactNodeView[Property];
};
export type ReactNodeViewConstructor = (...args: Parameters<NodeViewConstructor>) => ReactNodeView;
/**
 * Identifies a node view constructor as having been created
 * by @nytimes/react-prosemirror
 */
export declare const REACT_NODE_VIEW: unique symbol;
/**
 * Searches upward for the nearest node with a node key,
 * returning the first node key it finds associated with
 * a React node view.
 *
 * Returns the root key if no ancestor nodes have node keys.
 */
export declare function findNodeKeyUp(editorView: EditorView, pos: number): NodeKey;
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
export declare function createReactNodeViewConstructor(reactNodeViewConstructor: ReactNodeViewConstructor, registerPortal: RegisterPortal): ((node: Node, editorView: EditorView, getPos: () => number, decorations: readonly Decoration[], innerDecorations: DecorationSource) => NodeView) & {
    [REACT_NODE_VIEW]: boolean;
};
export {};
