import { Plugin, PluginKey } from "prosemirror-state";

export function createNodeKey() {
  const key = Math.floor(Math.random() * 0xffffff).toString(16);
  return key;
}

const rootKey = "ROOT_KEY";

export const reactKeysPluginKey = new PluginKey<{
  posToKey: Map<number, string>;
  keyToPos: Map<string, number>;
  keyToParent: Map<string, string>;
  keyToChildren: Map<string, string[]>;
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
          posToKey: new Map<number, string>([[-1, rootKey]]),
          keyToPos: new Map<string, number>([[rootKey, -1]]),
          keyToParent: new Map<string, string>(),
          keyToChildren: new Map<string, string[]>([[rootKey, []]]),
        };
        state.doc.descendants((_, pos) => {
          const key = createNodeKey();

          next.posToKey.set(pos, key);
          next.keyToPos.set(key, pos);
          const $pos = state.doc.resolve(pos);
          const parentPos = $pos.depth === 0 ? -1 : $pos.before();
          const parentKey = next.posToKey.get(parentPos);
          if (!parentKey) throw new Error("Missing parent key");

          next.keyToChildren.set(
            parentKey,
            (next.keyToChildren.get(parentKey) ?? []).concat(key)
          );
          next.keyToParent.set(key, parentKey);
          next.keyToChildren.set(key, []);

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
          posToKey: new Map<number, string>([[-1, rootKey]]),
          keyToPos: new Map<string, number>([[rootKey, -1]]),
          keyToParent: new Map<string, string>(),
          keyToChildren: new Map<string, string[]>([[rootKey, []]]),
        };
        const posToKeyEntries = Array.from(value.posToKey.entries()).sort(
          ([a], [b]) => a - b
        );
        for (const [pos, key] of posToKeyEntries) {
          if (pos === -1) continue;
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
          const $pos = newState.doc.resolve(pos);
          const parentPos = $pos.depth === 0 ? -1 : $pos.before();
          const parentKey = next.posToKey.get(parentPos);
          if (!parentKey) throw new Error("Missing parent key");
          if (!next.posToKey.has(pos)) {
            const key = createNodeKey();
            next.posToKey.set(pos, key);
            next.keyToPos.set(key, pos);
          }

          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const key = next.posToKey.get(pos)!;

          next.keyToChildren.set(
            parentKey,
            (next.keyToChildren.get(parentKey) ?? []).concat(key)
          );
          next.keyToParent.set(key, parentKey);
          next.keyToChildren.set(key, []);

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
