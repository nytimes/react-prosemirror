"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useComponentEventListeners", {
    enumerable: true,
    get: function() {
        return useComponentEventListeners;
    }
});
const _react = require("react");
const _componentEventListeners = require("../plugins/componentEventListeners.js");
function useComponentEventListeners() {
    const [registry, setRegistry] = (0, _react.useState)(new Map());
    const registerEventListener = (0, _react.useCallback)((eventType, handler)=>{
        const handlers = registry.get(eventType) ?? [];
        handlers.unshift(handler);
        if (!registry.has(eventType)) {
            registry.set(eventType, handlers);
            setRegistry(new Map(registry));
        }
    }, [
        registry
    ]);
    const unregisterEventListener = (0, _react.useCallback)((eventType, handler)=>{
        const handlers = registry.get(eventType);
        handlers?.splice(handlers.indexOf(handler), 1);
    }, [
        registry
    ]);
    const componentEventListenersPlugin = (0, _react.useMemo)(()=>(0, _componentEventListeners.componentEventListeners)(registry), [
        registry
    ]);
    return {
        registerEventListener,
        unregisterEventListener,
        componentEventListenersPlugin
    };
}
