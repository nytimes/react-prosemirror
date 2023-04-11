import {
  DependencyList,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

import { useForceUpdate } from "../hooks/useForceUpdate";
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
  const registry = useRef(
    new Map<keyof DOMEventMap, Set<EventHandler>>()
  ).current;

  const forceUpdate = useForceUpdate();

  const register = useCallback(
    (eventType: keyof DOMEventMap, handler: EventHandler) => {
      const handlers = registry.get(eventType) ?? new Set<EventHandler>();
      handlers.add(handler);
      if (!registry.has(eventType)) {
        // We only need to force an update when the set of event types
        // that we care about changes
        registry.set(eventType, handlers);
        forceUpdate();
      }
    },
    [registry, forceUpdate]
  );

  const unregister = useCallback(
    (eventType: keyof DOMEventMap, handler: EventHandler) => {
      const handlers = registry.get(eventType);
      if (!handlers) return;
      handlers.delete(handler);
    },
    [registry]
  );

  const reactEventPlugin = useMemo(
    () => createReactEventPlugin(registry),
    // We force an update whenever the set of event types that
    // we care about changes. This plugin only needs to be
    // recreated when that set (the set of registry keys)
    // changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [registry.keys()]
  );

  const editorDOMEventRegistry = useMemo(
    () => ({ register, unregister }),
    [register, unregister]
  );

  return { editorDOMEventRegistry, reactEventPlugin };
}

type Register<EventType extends keyof DOMEventMap = any> = (
  eventType: EventType,
  handler: EventHandler<EventType>
) => void;

type Unregister<EventType extends keyof DOMEventMap = any> =
  Register<EventType>;

type EditorDOMEventRegistryContextValue = {
  register: Register;
  unregister: Unregister;
};

const EditorDOMEventRegistryContext = createContext(
  null as unknown as EditorDOMEventRegistryContextValue
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
  }, deps);
}
