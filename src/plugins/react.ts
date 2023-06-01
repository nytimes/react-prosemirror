import { Plugin, PluginKey } from "prosemirror-state";

/**
 * This is a stand-in for the doc node itself, which doesn't have a
 * unique position to map to.
 */
export const ROOT_NODE_KEY = Symbol("portal registry root key");

export type NodeKey = string | typeof ROOT_NODE_KEY;

/**
 * Identifies a node view constructor as having been created
 * by @nytimes/react-prosemirror
 */
export const REACT_NODE_VIEW = Symbol("react node view");

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
 */
export function react() {
  return new Plugin({
    key: reactPluginKey,
    state: {
      init(_, state) {
        const next = {
          posToKey: new Map<number, string>(),
          keyToPos: new Map<NodeKey, number>(),
        };
        state.doc.descendants((node, pos) => {
          if (node.isText) return false;

          const key = createNodeKey();

          next.posToKey.set(pos, key);
          next.keyToPos.set(key, pos);
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
       */
      apply(tr, value, _, newState) {
        if (!tr.docChanged) return value;

        const next = {
          posToKey: new Map<number, string>(),
          keyToPos: new Map<string, number>(),
        };
        const nextKeys = new Set<string>();
        newState.doc.descendants((node, pos) => {
          if (node.isText) return false;

          const prevPos = tr.mapping.invert().map(pos);
          const prevKey = value.posToKey.get(prevPos) ?? createNodeKey();
          // If this transaction adds a new node, there will be multiple
          // nodes that map back to the same initial position. In this case,
          // create new keys for new nodes.
          const key = nextKeys.has(prevKey) ? createNodeKey() : prevKey;
          next.posToKey.set(pos, key);
          next.keyToPos.set(key, pos);
          nextKeys.add(key);
          return true;
        });
        return next;
      },
    },
  });
}
