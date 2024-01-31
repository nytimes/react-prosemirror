import { Node } from "prosemirror-model";
import { Plugin, PluginKey } from "prosemirror-state";

export function createNodeKey() {
  const key = Math.floor(Math.random() * 0xffffff).toString(16);
  return key;
}

export const reactKeysPluginKey = new PluginKey<{
  posToKey: Map<number, string>;
  keyToPos: Map<string, number>;
  posToNode: Map<number, Node>;
}>("@nytimes/react-prosemirror/reactKeys");

/**
 * Tracks a unique key for each (non-text) node in the
 * document, identified by its current position. Keys are
 * (mostly) stable across transaction applications. The
 * key for a given node can be accessed by that node's
 * current position in the document, and vice versa.
 */
export function reactKeys() {
  let composing = false;
  return new Plugin({
    key: reactKeysPluginKey,
    state: {
      init(_, state) {
        const next = {
          posToKey: new Map<number, string>(),
          keyToPos: new Map<string, number>(),
        };
        state.doc.descendants((_, pos) => {
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
        if (!tr.docChanged || composing) return value;
        const meta = tr.getMeta(reactKeysPluginKey);
        const keyToBust = meta?.type === "bustKey" && meta.payload.key;

        const next = {
          posToKey: new Map<number, string>(),
          keyToPos: new Map<string, number>(),
        };
        const posToKeyEntries = Array.from(value.posToKey.entries()).sort(
          ([a], [b]) => a - b
        );
        for (const [pos, key] of posToKeyEntries) {
          const { pos: newPos, deleted } = tr.mapping.mapResult(pos);
          if (deleted) continue;

          let newKey = key;

          if (keyToBust === key) {
            newKey = createNodeKey();
          }

          next.posToKey.set(newPos, newKey);
          next.keyToPos.set(newKey, newPos);
        }
        newState.doc.descendants((_, pos) => {
          if (next.posToKey.has(pos)) return true;

          const key = createNodeKey();
          next.posToKey.set(pos, key);
          next.keyToPos.set(key, pos);
          return true;
        });
        return next;
      },
    },
    props: {
      handleDOMEvents: {
        compositionstart: () => {
          composing = true;
        },
        compositionend: () => {
          composing = false;
        },
      },
    },
  });
}
