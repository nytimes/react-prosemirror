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
    REACT_NODE_VIEW: ()=>REACT_NODE_VIEW,
    findNearestRegistryKey: ()=>findNearestRegistryKey,
    createRegistryKey: ()=>createRegistryKey,
    reactNodeViewPlugin: ()=>reactNodeViewPlugin
});
const _prosemirrorState = require("prosemirror-state");
const _portalRegistryContextJs = require("../contexts/PortalRegistryContext.js");
const REACT_NODE_VIEW = Symbol("react node view");
function findNearestRegistryKey(editorView, pos) {
    const pluginState = reactNodeViewPlugin.getState(editorView.state);
    if (!pluginState) return _portalRegistryContextJs.PORTAL_REGISTRY_ROOT_KEY;
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
    return _portalRegistryContextJs.PORTAL_REGISTRY_ROOT_KEY;
}
function createRegistryKey() {
    return Math.floor(Math.random() * 0xffffff).toString(16);
}
const reactNodeViewPlugin = new _prosemirrorState.Plugin({
    key: new _prosemirrorState.PluginKey("reactNodeView"),
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
