import { Node } from "prosemirror-model";
import { Plugin, PluginKey } from "prosemirror-state";

export function createNodeKey(node: Node) {
  const key = Math.floor(Math.random() * 0xffffff).toString(16);
  if (node.isTextblock && node.textContent === "") {
    return `${key}-empty`;
  }
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
        state.doc.descendants((node, pos) => {
          const key = createNodeKey(node);

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

        const next = {
          posToKey: new Map<number, string>(),
          keyToPos: new Map<string, number>(),
        };
        const nextKeys = new Set<string>();
        newState.doc.descendants((node, pos) => {
          const prevPos = tr.mapping.invert().map(pos);
          const prevKey = value.posToKey.get(prevPos) ?? createNodeKey(node);
          // If this transaction adds a new node, there will be multiple
          // nodes that map back to the same initial position. In this case,
          // create new keys for new nodes.
          let key = nextKeys.has(prevKey) ? createNodeKey(node) : prevKey;
          if (
            (key.endsWith("-empty") &&
              node.isTextblock &&
              node.textContent !== "") ||
            (!key.endsWith("-empty") &&
              node.isTextblock &&
              node.textContent === "")
          ) {
            key = createNodeKey(node);
          }
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
