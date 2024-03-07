import { Plugin, PluginKey } from "prosemirror-state";
/**
 * This is a stand-in for the doc node itself, which doesn't have a
 * unique position to map to.
 */ export const ROOT_NODE_KEY = Symbol("@nytimes/react-prosemirror/root-node-key");
export function createNodeKey() {
    return Math.floor(Math.random() * 0xffffff).toString(16);
}
export const reactPluginKey = new PluginKey("@nytimes/react-prosemirror/react");
/**
 * Tracks a unique key for each (non-text) node in the
 * document, identified by its current position. Keys are
 * (mostly) stable across transaction applications. The
 * key for a given node can be accessed by that node's
 * current position in the document, and vice versa.
 */ export function react() {
    return new Plugin({
        key: reactPluginKey,
        state: {
            init (_, state) {
                const next = {
                    posToKey: new Map(),
                    keyToPos: new Map(),
                    posToNode: new Map()
                };
                state.doc.descendants((node, pos)=>{
                    if (node.isText) return false;
                    const key = createNodeKey();
                    next.posToKey.set(pos, key);
                    next.keyToPos.set(key, pos);
                    next.posToNode.set(pos, node);
                    return true;
                });
                return next;
            },
            /**
       * Keeps node keys (mostly) stable across transactions.
       *
       * To accomplish this, we map each node position backwards
       * through the transaction to identify its previous position,
       * and thereby retrieve its previous key.
       */ apply (tr, value, _, newState) {
                if (!tr.docChanged) return value;
                const next = {
                    posToKey: new Map(),
                    keyToPos: new Map(),
                    posToNode: new Map()
                };
                newState.doc.descendants((node, pos)=>{
                    if (node.isText) return false;
                    const prevPos = tr.mapping.invert().map(pos);
                    const prevKey = value.posToKey.get(prevPos) ?? createNodeKey();
                    let key = prevKey;
                    // If this transaction adds a new node, there map be multiple
                    // nodes that map back to the same initial position.
                    if (next.keyToPos.has(prevKey)) {
                        // If the current node was simply moved by the transaction,
                        // keep its key the same, and update the key for the node that
                        // was newly inserted.
                        if (value.posToNode.get(prevPos)?.eq(node)) {
                            // Already checked existence
                            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                            const newNodePos = next.keyToPos.get(prevKey);
                            const newNodeKey = createNodeKey();
                            next.posToKey.set(newNodePos, newNodeKey);
                            next.keyToPos.set(newNodeKey, newNodePos);
                        } else {
                            // If the current node is the new one, then generate a new
                            // key for it
                            key = createNodeKey();
                        }
                    }
                    next.posToKey.set(pos, key);
                    next.keyToPos.set(key, pos);
                    next.posToNode.set(pos, node);
                    return true;
                });
                return next;
            }
        }
    });
}
