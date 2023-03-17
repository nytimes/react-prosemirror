import { Plugin } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

type KeyboardEventHandler = (view: EditorView, event: KeyboardEvent) => boolean;

export function reactEvents(eventHandlerRegistry: Set<KeyboardEventHandler>) {
  const plugin = new Plugin({
    props: {
      handleKeyDown(view, event) {
        for (const handler of eventHandlerRegistry) {
          if (handler(view, event)) return true;
        }
        return false;
      },
    },
  });
  return plugin;
}
