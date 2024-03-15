import { Node } from "prosemirror-model";
import { Plugin, PluginKey } from "prosemirror-state";
export declare function createNodeKey(): string;
export declare const reactKeysPluginKey: PluginKey<{
    posToKey: Map<number, string>;
    keyToPos: Map<string, number>;
    posToNode: Map<number, Node>;
}>;
/**
 * Tracks a unique key for each (non-text) node in the
 * document, identified by its current position. Keys are
 * (mostly) stable across transaction applications. The
 * key for a given node can be accessed by that node's
 * current position in the document, and vice versa.
 */
export declare function reactKeys(): Plugin<{
    posToKey: Map<number, string>;
    keyToPos: Map<string, number>;
}>;
