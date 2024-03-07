import { Plugin } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { PortalRegistryKey } from "../contexts/PortalRegistryContext.js";
/**
 * Identifies a node view constructor as having been created
 * by @nytimes/react-prosemirror
 */
export declare const REACT_NODE_VIEW: unique symbol;
/**
 * Searches upward for the nearest node with a registry key,
 * returning the first registry key it finds associated with
 * a React node view.
 *
 * Returns the root key if no ancestor nodes have registry keys.
 */
export declare function findNearestRegistryKey(editorView: EditorView, pos: number): PortalRegistryKey;
export declare function createRegistryKey(): string;
/**
 * Tracks a registry key for each node in the document,
 * identified by its current position. Keys are stable
 * across transaction applications. The key for a given
 * node can be accessed by that node's current position
 * in the document.
 *
 * @privateRemarks
 *
 * The `seed` provides a mechanism for consumers to
 * identify when the plugin has been reinitialized. Keys
 * are stable across transaction applications, but if the
 * plugin is reinitialized (e.g. because consuming code
 * calls `EditorState.create` again for whatever reason),
 * all of the previous keys will be dropped. Consumers
 * can compare the new seed to the one they were initialized
 * with, and invalidate caches, etc, when it changes.
 */
export declare const reactNodeViewPlugin: Plugin<Map<number, string>>;
