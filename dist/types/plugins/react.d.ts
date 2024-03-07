import type { Node } from "prosemirror-model";
import { Plugin, PluginKey } from "prosemirror-state";
/**
 * This is a stand-in for the doc node itself, which doesn't have a
 * unique position to map to.
 */
export declare const ROOT_NODE_KEY: unique symbol;
export type NodeKey = string | typeof ROOT_NODE_KEY;
export declare function createNodeKey(): string;
export type ReactPluginState = {
    posToKey: Map<number, string>;
    keyToPos: Map<NodeKey, number>;
    posToNode: Map<number, Node>;
};
export declare const reactPluginKey: PluginKey<ReactPluginState>;
/**
 * Tracks a unique key for each (non-text) node in the
 * document, identified by its current position. Keys are
 * (mostly) stable across transaction applications. The
 * key for a given node can be accessed by that node's
 * current position in the document, and vice versa.
 */
export declare function react(): Plugin<ReactPluginState>;
