import type { DOMEventMap } from "prosemirror-view";
import { useCallback, useMemo, useState } from "react";

import {
  EventHandler,
  createComponentEventListenersPlugin,
} from "../plugins/componentEventListenersPlugin.js";

/**
 * Produces a plugin that can be used with ProseMirror to handle DOM
 * events at the EditorView.dom element.
 *
 * - `reactEventsPlugin` is a ProseMirror plugin for handling DOM events
 * at the EditorView.dom element. It should be passed to `useEditorView`,
 * along with any other plugins.
 *
 * - `registerEventListener` and `unregisterEventListener` should be
 * passed to `EditorProvider`.
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
 */
export function useComponentEventListenersPlugin() {
  const [registry, setRegistry] = useState(
    new Map<keyof DOMEventMap, Set<EventHandler>>()
  );

  const registerEventListener = useCallback(
    (eventType: keyof DOMEventMap, handler: EventHandler) => {
      const handlers = registry.get(eventType) ?? new Set<EventHandler>();
      handlers.add(handler);
      if (!registry.has(eventType)) {
        registry.set(eventType, handlers);
        setRegistry(new Map(registry));
      }
    },
    [registry]
  );

  const unregisterEventListener = useCallback(
    (eventType: keyof DOMEventMap, handler: EventHandler) => {
      const handlers = registry.get(eventType);
      handlers?.delete(handler);
    },
    [registry]
  );

  const componentEventListenersPlugin = useMemo(
    () => createComponentEventListenersPlugin(registry),
    [registry]
  );

  return {
    registerEventListener,
    unregisterEventListener,
    componentEventListenersPlugin,
  };
}
