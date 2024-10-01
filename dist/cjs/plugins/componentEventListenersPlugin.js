"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createComponentEventListenersPlugin", {
    enumerable: true,
    get: ()=>createComponentEventListenersPlugin
});
const _prosemirrorState = require("prosemirror-state");
const _reactDom = require("react-dom");
function createComponentEventListenersPlugin(eventHandlerRegistry) {
    const domEventHandlers = {};
    for (const [eventType, handlers] of eventHandlerRegistry.entries()){
        function handleEvent(view, event) {
            for (const handler of handlers){
                let handled = false;
                (0, _reactDom.unstable_batchedUpdates)(()=>{
                    handled = !!handler.call(this, view, event);
                });
                if (handled || event.defaultPrevented) return true;
            }
            return false;
        }
        domEventHandlers[eventType] = handleEvent;
    }
    const plugin = new _prosemirrorState.Plugin({
        key: new _prosemirrorState.PluginKey("componentEventListeners"),
        props: {
            handleDOMEvents: domEventHandlers
        }
    });
    return plugin;
}
