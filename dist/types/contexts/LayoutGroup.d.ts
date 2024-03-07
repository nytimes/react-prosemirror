import React from "react";
import type { DependencyList, EffectCallback } from "react";
interface DeferredLayoutEffectsContextProviderProps {
    children: React.ReactNode;
}
/**
 * Provides a deferral point for deferred layout effects.
 * All effects registered with `useDeferredLayoutEffect`
 * by children of this provider will execute *after* all
 * effects registered by `useLayoutEffect` by children of
 * this provider.
 */
export declare function LayoutGroup({ children, }: DeferredLayoutEffectsContextProviderProps): JSX.Element;
/**
 * Like `useLayoutEffect`, but all effect executions are run
 * *after* the `DeferredLayoutEffectsProvider` layout effects
 * phase.
 *
 * This hook allows child components to enqueue layout effects
 * that won't be safe to run until after a parent component's
 * layout effects have run.
 */
export declare function useLayoutGroupEffect(effect: EffectCallback, deps?: DependencyList): void;
export {};
