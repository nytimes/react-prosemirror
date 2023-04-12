import { Plugin, PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import type { DOMEventMap } from "prosemirror-view";

export type EventHandler<
  EventType extends keyof DOMEventMap = keyof DOMEventMap
> = (view: EditorView, event: DOMEventMap[EventType]) => boolean | void;

export function createReactEventPlugin(
  eventHandlerRegistry: Map<keyof DOMEventMap, Set<EventHandler>>
) {
  const domEventHandlers: Record<keyof DOMEventMap, EventHandler> = {};

  for (const [eventType, handlers] of eventHandlerRegistry.entries()) {
    function handleEvent(view: EditorView, event: Event) {
      console.log(handlers);
      for (const handler of handlers) {
        if (handler(view, event) || event.defaultPrevented) return true;
      }
      return false;
    }

    domEventHandlers[eventType] = handleEvent;
  }

  const plugin = new Plugin({
    key: new PluginKey("reactEvents"),
    props: {
      handleDOMEvents: domEventHandlers,
    },
  });

  return plugin;
}
