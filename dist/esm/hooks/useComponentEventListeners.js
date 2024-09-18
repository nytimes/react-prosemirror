import { useCallback, useMemo, useState } from "react";
import { componentEventListeners } from "../plugins/componentEventListeners.js";
/**
 * Produces a plugin that can be used with ProseMirror to handle DOM
 * events at the EditorView.dom element.
 *
 * - `reactEventsPlugin` is a ProseMirror plugin for handling DOM events
 * at the EditorView.dom element. It should be passed to `useEditorView`,
 * along with any other plugins.
 *
 * - `registerEventListener` and `unregisterEventListener` should be
 * passed to `EditorContext.Provider`.
 *
 * @privateRemarks
 *
 * This hook uses a combination of mutable and immutable updates to give
 * us precise control over when we re-create the ProseMirror plugin.
 *
 * The plugin has a mutable reference to the set of handlers for each
 * event type, but the set of event types is static. This means that we
 * need to produce a new ProseMirror plugin whenever a new event type is
 * registered. We avoid producing a new ProseMirrer plugin in any other
 * scenario to avoid the performance overhead of reconfiguring the plugins
 * in the EditorView.
 *
 * To accomplish this, we shallowly clone the registry whenever a new event
 * type is registered.
 */ export function useComponentEventListeners() {
    const [registry, setRegistry] = useState(new Map());
    const registerEventListener = useCallback((eventType, handler)=>{
        const handlers = registry.get(eventType) ?? [];
        handlers.unshift(handler);
        if (!registry.has(eventType)) {
            registry.set(eventType, handlers);
            setRegistry(new Map(registry));
        }
    }, [
        registry
    ]);
    const unregisterEventListener = useCallback((eventType, handler)=>{
        const handlers = registry.get(eventType);
        handlers?.splice(handlers.indexOf(handler), 1);
    }, [
        registry
    ]);
    const componentEventListenersPlugin = useMemo(()=>componentEventListeners(registry), [
        registry
    ]);
    return {
        registerEventListener,
        unregisterEventListener,
        componentEventListenersPlugin
    };
}
