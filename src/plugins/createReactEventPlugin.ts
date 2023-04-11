import { Plugin } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

export interface DOMEventMap extends HTMLElementEventMap {
  [event: string]: Event;
}

export type EventHandler<
  EventType extends keyof DOMEventMap = keyof DOMEventMap
> = (view: EditorView, event: DOMEventMap[EventType]) => boolean | void;

export function createReactEventPlugin(
  eventHandlerRegistry: Map<keyof DOMEventMap, Set<EventHandler>>
) {
  const domEventHandlers: Record<keyof DOMEventMap, EventHandler> = {};
  for (const [event, handlers] of eventHandlerRegistry.entries()) {
    function handleEvent(view: EditorView, event: Event) {
      for (const handler of handlers) {
        if (handler(view, event)) return true;
      }
      return false;
    }
    domEventHandlers[event] = handleEvent;
  }
  const plugin = new Plugin({
    props: {
      handleDOMEvents: domEventHandlers,
    },
  });
  return plugin;
}
