import { Plugin, PluginKey } from "prosemirror-state";

/**
 * This is a stand-in for the doc node itself, which doesn't have a
 * unique position to map to.
 */
export const ROOT_NODE_KEY = Symbol("@nytimes/react-prosemirror/root-node-key");

export type NodeKey = string | symbol;

export function createNodeKey() {
  return Math.floor(Math.random() * 0xffffff).toString(16);
}

export type ReactPluginState = {
  posToKey: Map<number, string>;
  keyToPos: Map<NodeKey, number>;
};

export const reactPluginKey = new PluginKey<ReactPluginState>(
  "@nytimes/react-prosemirror/react"
);

/**
 * Tracks a unique key for each (non-text) node in the
 * document, identified by its current position. Keys are
 * (mostly) stable across transaction applications. The
 * key for a given node can be accessed by that node's
 * current position in the document, and vice versa.
 */
export function react() {
  return new Plugin<ReactPluginState>({
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
        for (const [pos, key] of value.posToKey.entries()) {
          const { pos: newPos, deleted } = tr.mapping.mapResult(pos);
          if (deleted) continue;

          next.posToKey.set(newPos, key);
          next.keyToPos.set(key, newPos);
        }
        newState.doc.descendants((node, pos) => {
          if (node.isText) return false;
          if (next.posToKey.has(pos)) return true;

          const key = createNodeKey();
          next.posToKey.set(pos, key);
          next.keyToPos.set(key, pos);
          return true;
        });
        return next;
      },
    },
  });
}
