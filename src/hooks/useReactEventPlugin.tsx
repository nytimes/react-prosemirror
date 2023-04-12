import type { DOMEventMap } from "prosemirror-view";
import { useCallback, useMemo, useState } from "react";

import { createReactEventPlugin } from "../plugins/createReactEventPlugin.js";
import type { EventHandler } from "../plugins/createReactEventPlugin.js";

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
 */
export function useReactEventPlugin() {
  const [registry, setRegistry] = useState(
    new Map<keyof DOMEventMap, Set<EventHandler>>()
  );

  const registerEventListener = useCallback(
    (eventType: keyof DOMEventMap, handler: EventHandler) => {
      const handlers = registry.get(eventType) ?? new Set<EventHandler>();
      handlers.add(handler);
      if (!registry.has(eventType)) {
        // We only need to force an update when the set of event types
        // that we care about changes
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

  const reactEventPlugin = useMemo(
    () => createReactEventPlugin(registry),
    [registry]
  );

  return { registerEventListener, unregisterEventListener, reactEventPlugin };
}
