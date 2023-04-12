import {
  DependencyList,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  DOMEventMap,
  EventHandler,
  createReactEventPlugin,
} from "../plugins/createReactEventPlugin";

/**
 * Produces a plugin that can be used with ProseMirror to handle DOM
 * events at the EditorView.dom element.
 *
 * - `reactEventsPlugin` is a ProseMirror plugin for handling DOM events
 * at the EditorView.dom element. It should be passed to `useEditorView`,
 * along with any other plugins.
 *
 * - 'registry' should be passed as the value to
 * `EditorDOMEventRegistryContext`.
 */
export function useReactEventPlugin() {
  const [registry, setRegistry] = useState(
    new Map<keyof DOMEventMap, Set<EventHandler>>()
  );

  console.log(registry);

  const register = useCallback(
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

  const unregister = useCallback(
    (eventType: keyof DOMEventMap, handler: EventHandler) => {
      const handlers = registry.get(eventType);
      handlers?.delete(handler);
    },
    [registry]
  );

  const reactEventPlugin = useMemo(
    () => (
      console.log("creating new plugin"), createReactEventPlugin(registry)
    ),
    [registry]
  );

  const editorDOMEventRegistry = useMemo(
    () => ({ register, unregister }),
    [register, unregister]
  );

  return { editorDOMEventRegistry, reactEventPlugin };
}

interface EditorDOMEventRegistry {
  register<EventType extends keyof DOMEventMap>(
    eventType: EventType,
    handler: EventHandler<EventType>
  ): void;
  unregister<EventType extends keyof DOMEventMap>(
    eventType: EventType,
    handler: EventHandler<EventType>
  ): void;
}

const EditorDOMEventRegistryContext = createContext(
  null as unknown as EditorDOMEventRegistry
);

export const EditorDOMEventsProvider = EditorDOMEventRegistryContext.Provider;

export function useEditorDOMEvent<EventType extends keyof DOMEventMap>(
  eventType: EventType,
  handler: EventHandler<EventType>,
  deps?: DependencyList
) {
  const { register, unregister } = useContext(EditorDOMEventRegistryContext);

  useEffect(() => {
    register(eventType, handler);
    return () => unregister(eventType, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [register, unregister, ...(deps ?? [])]);
}
