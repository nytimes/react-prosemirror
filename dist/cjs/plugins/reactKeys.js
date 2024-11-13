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
    createNodeKey: ()=>createNodeKey,
    reactKeysPluginKey: ()=>reactKeysPluginKey,
    reactKeys: ()=>reactKeys
});
const _prosemirrorState = require("prosemirror-state");
function createNodeKey() {
    const key = Math.floor(Math.random() * 0xffffffffffff).toString(16);
    return key;
}
const reactKeysPluginKey = new _prosemirrorState.PluginKey("@nytimes/react-prosemirror/reactKeys");
function reactKeys() {
    let composing = false;
    return new _prosemirrorState.Plugin({
        key: reactKeysPluginKey,
        state: {
            init (_, state) {
                const next = {
                    posToKey: new Map(),
                    keyToPos: new Map()
                };
                state.doc.descendants((_, pos)=>{
                    const key = createNodeKey();
                    next.posToKey.set(pos, key);
                    next.keyToPos.set(key, pos);
                    return true;
                });
                return next;
            },
            /**
       * Keeps node keys stable across transactions.
       *
       * To accomplish this, we map each node position forwards
       * through the transaction to identify its current position,
       * and assign its key to that new position, dropping it if the
       * node was deleted.
       */ apply (tr, value, _, newState) {
                if (!tr.docChanged || composing) return value;
                const meta = tr.getMeta(reactKeysPluginKey);
                const keyToBust = meta?.type === "bustKey" && meta.payload.key;
                const next = {
                    posToKey: new Map(),
                    keyToPos: new Map()
                };
                const posToKeyEntries = Array.from(value.posToKey.entries()).sort((param, param1)=>{
                    let [a] = param, [b] = param1;
                    return a - b;
                });
                for (const [pos, key] of posToKeyEntries){
                    const { pos: newPos , deleted  } = tr.mapping.mapResult(pos);
                    if (deleted) continue;
                    let newKey = key;
                    if (keyToBust === key) {
                        newKey = createNodeKey();
                    }
                    next.posToKey.set(newPos, newKey);
                    next.keyToPos.set(newKey, newPos);
                }
                newState.doc.descendants((_, pos)=>{
                    if (next.posToKey.has(pos)) return true;
                    const key = createNodeKey();
                    next.posToKey.set(pos, key);
                    next.keyToPos.set(key, pos);
                    return true;
                });
                return next;
            }
        },
        props: {
            handleDOMEvents: {
                compositionstart: ()=>{
                    composing = true;
                },
                compositionend: ()=>{
                    composing = false;
                }
            }
        }
    });
}
