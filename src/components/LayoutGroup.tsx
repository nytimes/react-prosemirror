import React, { useCallback, useLayoutEffect, useRef } from "react";
import type { EffectCallback } from "react";

import { useForceUpdate } from "../hooks/useForceUpdate.js";

import { LayoutGroupContext } from "./LayoutGroupContext.js";

export interface LayoutGroupProps {
  children: React.ReactNode;
}

/**
 * Provides a boundary for grouping layout effects.
 *
 * Descendant components can invoke the `useLayoutGroupEffect` hook to register
 * effects that run after all descendants within the group have processed their
 * regular layout effects.
 */
export function LayoutGroup({ children }: LayoutGroupProps) {
  const createQueue = useRef(new Set<() => void>()).current;
  const destroyQueue = useRef(new Set<() => void>()).current;

  const forceUpdate = useForceUpdate();
  const isUpdatePending = useRef(true);

  const ensureFlush = useCallback(() => {
    if (!isUpdatePending.current) {
      forceUpdate();
      isUpdatePending.current = true;
    }
  }, [forceUpdate]);

  const register = useCallback<typeof useLayoutEffect>(
    (effect: EffectCallback) => {
      let destroy: ReturnType<EffectCallback>;
      const create = () => {
        destroy = effect();
      };

      createQueue.add(create);
      ensureFlush();

      return () => {
        createQueue.delete(create);
        if (destroy) {
          destroyQueue.add(destroy);
          ensureFlush();
        }
      };
    },
    [createQueue, destroyQueue, ensureFlush]
  );

  useLayoutEffect(() => {
    isUpdatePending.current = false;
    createQueue.forEach((create) => create());
    createQueue.clear();
    return () => {
      destroyQueue.forEach((destroy) => destroy());
      destroyQueue.clear();
    };
  });

  return (
    <LayoutGroupContext.Provider value={register}>
      {children}
    </LayoutGroupContext.Provider>
  );
}
