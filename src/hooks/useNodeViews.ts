import { Context, useContext, useEffect, useMemo, useRef } from "react";

import {
  ReactNodeView,
  createReactNodeViewConstructor,
} from "../nodeViews/createReactNodeViewConstructor.js";

export function useNodeViews(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contexts: Context<any>[],
  reactNodeViews?: Record<string, ReactNodeView>
) {
  // This is definitely NOT ALLOWED, but since we know that contexts is static
  // it's safer than React thinks it is.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const contextValues = contexts.map((context) => useContext(context));

  const contextValuesRef = useRef<unknown[]>(contextValues);
  contextValuesRef.current = contextValues;

  const contextValuesSubscribers = useRef<
    Array<(contextValues: unknown[]) => void>
  >([]);

  useEffect(
    () => {
      contextValuesSubscribers.current.forEach((listener) => {
        listener(contextValues);
      });
    },
    // This is actully what we want; we only want to update
    // listeners when one of the context values has changed,
    // not every render when we build a new object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    contextValues
  );

  const nodeViews = useMemo(() => {
    if (!reactNodeViews) return undefined;
    const nodeViewEntries = Object.entries(reactNodeViews);
    const reactNodeViewEntries = nodeViewEntries.map(
      ([name, reactNodeView]) => [
        name,
        createReactNodeViewConstructor(
          reactNodeView,
          contexts,
          () => contextValuesRef.current,
          (listener) => contextValuesSubscribers.current.push(listener)
        ),
      ]
    );
    return Object.fromEntries(reactNodeViewEntries);
  }, [reactNodeViews, contexts]);

  return { nodeViews };
}
