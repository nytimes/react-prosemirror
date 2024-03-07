"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    ROOT_NODE_KEY: ()=>ROOT_NODE_KEY,
    createNodeKey: ()=>createNodeKey,
    reactPluginKey: ()=>reactPluginKey,
    react: ()=>react
});
const _prosemirrorState = require("prosemirror-state");
const ROOT_NODE_KEY = Symbol("@nytimes/react-prosemirror/root-node-key");
function createNodeKey() {
    return Math.floor(Math.random() * 0xffffff).toString(16);
}
const reactPluginKey = new _prosemirrorState.PluginKey("@nytimes/react-prosemirror/react");
function react() {
    return new _prosemirrorState.Plugin({
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
