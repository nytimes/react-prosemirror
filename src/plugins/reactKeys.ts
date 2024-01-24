import { Plugin, PluginKey } from "prosemirror-state";

export function createNodeKey() {
  const key = Math.floor(Math.random() * 0xffffff).toString(16);
  return key;
}

export const reactKeysPluginKey = new PluginKey<{
  posToKey: Map<number, string>;
  keyToPos: Map<string, number>;
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
        const nextKeys = new Set<string>();
        newState.doc.descendants((_, pos) => {
          const prevPos = tr.mapping.invert().map(pos);
          const prevKey = value.posToKey.get(prevPos) ?? createNodeKey();
          const key =
            // If this transaction adds a new node, there will be multiple
            // nodes that map back to the same initial position. In this case,
            // create new keys for new nodes.
            nextKeys.has(prevKey) ||
            // After IME compositions, we specifically bust the parent's key
            // so that we ensure that we blow away the temporary text node
            // used for the composition
            //
            // TODO: This is a pretty blunt tool; could we more precisely
            // remove the temporary composition text node instead?
            keyToBust === prevKey
              ? createNodeKey()
              : prevKey;
          next.posToKey.set(pos, key);
          next.keyToPos.set(key, pos);
          nextKeys.add(key);
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
