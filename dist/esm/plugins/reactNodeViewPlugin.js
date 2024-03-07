import { Plugin, PluginKey } from "prosemirror-state";
import { PORTAL_REGISTRY_ROOT_KEY } from "../contexts/PortalRegistryContext.js";
/**
 * Identifies a node view constructor as having been created
 * by @nytimes/react-prosemirror
 */ export const REACT_NODE_VIEW = Symbol("react node view");
/**
 * Searches upward for the nearest node with a registry key,
 * returning the first registry key it finds associated with
 * a React node view.
 *
 * Returns the root key if no ancestor nodes have registry keys.
 */ export function findNearestRegistryKey(editorView, pos) {
    const pluginState = reactNodeViewPlugin.getState(editorView.state);
    if (!pluginState) return PORTAL_REGISTRY_ROOT_KEY;
    const positionRegistry = pluginState;
    const $pos = editorView.state.doc.resolve(pos);
    for(let d = $pos.depth; d > 0; d--){
        const ancestorNodeTypeName = $pos.node(d).type.name;
        const ancestorNodeView = editorView.props.nodeViews?.[ancestorNodeTypeName];
        if (!ancestorNodeView?.[REACT_NODE_VIEW]) continue;
        const ancestorPos = $pos.before(d);
        const ancestorKey = positionRegistry.get(ancestorPos);
        if (ancestorKey) return ancestorKey;
    }
    return PORTAL_REGISTRY_ROOT_KEY;
}
export function createRegistryKey() {
    return Math.floor(Math.random() * 0xffffff).toString(16);
}
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
 */ export const reactNodeViewPlugin = new Plugin({
    key: new PluginKey("reactNodeView"),
    state: {
        init (_, state) {
            const next = new Map();
            state.doc.descendants((_, pos)=>{
                const key = createRegistryKey();
                next.set(pos, key);
            });
            return next;
        },
        apply (tr, value, _, newState) {
            if (!tr.docChanged) return value;
            const next = new Map();
            const nextKeys = new Set();
            newState.doc.descendants((_, pos)=>{
                const prevPos = tr.mapping.invert().map(pos);
                const prevKey = value.get(prevPos) ?? createRegistryKey();
                // If several consecutive nodes are added in a single transaction,
                // their positions will map back to the same previous position.
                // We need a new key for each new node, so we have to verify uniqueness
                // here.
                const key = nextKeys.has(prevKey) ? createRegistryKey() : prevKey;
                next.set(pos, key);
                nextKeys.add(key);
            });
            return next;
        }
    }
});
