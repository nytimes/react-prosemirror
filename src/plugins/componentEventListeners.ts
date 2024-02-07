import { Plugin, PluginKey } from "prosemirror-state";
import { DOMEventMap, EditorView } from "prosemirror-view";
import { unstable_batchedUpdates as batch } from "react-dom";

export type EventHandler<
  EventType extends keyof DOMEventMap = keyof DOMEventMap,
> = (
  this: Plugin,
  view: EditorView,
  event: DOMEventMap[EventType]
) => boolean | void;

export function componentEventListeners(
  eventHandlerRegistry: Map<keyof DOMEventMap, Iterable<EventHandler>>
) {
  const domEventHandlers: Record<keyof DOMEventMap, EventHandler> = {};

  for (const [eventType, handlers] of eventHandlerRegistry.entries()) {
    function handleEvent(this: Plugin, view: EditorView, event: Event) {
      for (const handler of handlers) {
        let handled = false;
        batch(() => {
          handled = !!handler.call(this, view, event);
        });
        if (handled || event.defaultPrevented) return true;
      }
      return false;
    }

    domEventHandlers[eventType] = handleEvent;
  }

  const plugin = new Plugin({
    key: new PluginKey("@nytimes/react-prosemirror/componentEventListeners"),
    props: {
      handleDOMEvents: domEventHandlers,
    },
  });

  return plugin;
}
