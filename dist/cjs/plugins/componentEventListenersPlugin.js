"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createComponentEventListenersPlugin", {
    enumerable: true,
    get: function() {
        return createComponentEventListenersPlugin;
    }
});
const _prosemirrorstate = require("prosemirror-state");
const _reactdom = require("react-dom");
function createComponentEventListenersPlugin(eventHandlerRegistry) {
    const domEventHandlers = {};
    for (const [eventType, handlers] of eventHandlerRegistry.entries()){
        function handleEvent(view, event) {
            for (const handler of handlers){
                let handled = false;
                (0, _reactdom.unstable_batchedUpdates)(()=>{
                    handled = !!handler.call(this, view, event);
                });
                if (handled || event.defaultPrevented) return true;
            }
            return false;
        }
        domEventHandlers[eventType] = handleEvent;
    }
    const plugin = new _prosemirrorstate.Plugin({
        key: new _prosemirrorstate.PluginKey("componentEventListeners"),
        props: {
            handleDOMEvents: domEventHandlers
        }
    });
    return plugin;
}
