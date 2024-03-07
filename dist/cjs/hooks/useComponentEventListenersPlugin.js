"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useComponentEventListenersPlugin", {
    enumerable: true,
    get: ()=>useComponentEventListenersPlugin
});
const _react = require("react");
const _componentEventListenersPluginJs = require("../plugins/componentEventListenersPlugin.js");
function useComponentEventListenersPlugin() {
    const [registry, setRegistry] = (0, _react.useState)(new Map());
    const registerEventListener = (0, _react.useCallback)((eventType, handler)=>{
        const handlers = registry.get(eventType) ?? new Set();
        handlers.add(handler);
        if (!registry.has(eventType)) {
            registry.set(eventType, handlers);
            setRegistry(new Map(registry));
        }
    }, [
        registry
    ]);
    const unregisterEventListener = (0, _react.useCallback)((eventType, handler)=>{
        const handlers = registry.get(eventType);
        handlers?.delete(handler);
    }, [
        registry
    ]);
    const componentEventListenersPlugin = (0, _react.useMemo)(()=>(0, _componentEventListenersPluginJs.createComponentEventListenersPlugin)(registry), [
        registry
    ]);
    return {
        registerEventListener,
        unregisterEventListener,
        componentEventListenersPlugin
    };
}
