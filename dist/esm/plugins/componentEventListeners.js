import { Plugin, PluginKey } from "prosemirror-state";
import { unstable_batchedUpdates as batch } from "react-dom";
export function componentEventListeners(eventHandlerRegistry) {
    const domEventHandlers = {};
    for (const [eventType, handlers] of eventHandlerRegistry.entries()){
        function handleEvent(view, event) {
            for (const handler of handlers){
                let handled = false;
                batch(()=>{
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
            handleDOMEvents: domEventHandlers
        }
    });
    return plugin;
}
