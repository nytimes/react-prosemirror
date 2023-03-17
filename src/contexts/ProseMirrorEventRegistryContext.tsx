import { EditorView } from "prosemirror-view";
import {
  DependencyList,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";

type KeyboardEventHandler = (view: EditorView, event: KeyboardEvent) => boolean;

export function useProseMirrorEventRegistry() {
  const registry = useRef(new Set<KeyboardEventHandler>()).current;

  const register = useCallback(
    (handler: KeyboardEventHandler) => {
      registry.add(handler);
    },
    [registry]
  );

  const unregister = useCallback(
    (handler: KeyboardEventHandler) => {
      registry.delete(handler);
    },
    [registry]
  );

  return { register, unregister, registry };
}

type Register = (handler: KeyboardEventHandler) => void;

type Unregister = Register;

type ProseMirrorEventRegistryContextValue = {
  register: Register;
  unregister: Unregister;
};

export const ProseMirrorEventRegistryContext = createContext(
  null as unknown as ProseMirrorEventRegistryContextValue
);

export function useProseMirrorEvent(
  handler: KeyboardEventHandler,
  deps?: DependencyList
) {
  const { register, unregister } = useContext(ProseMirrorEventRegistryContext);
  useEffect(() => {
    register(handler);
    return () => unregister(handler);
  }, deps);
}
