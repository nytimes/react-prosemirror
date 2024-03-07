import React, { createContext, useCallback, useContext, useLayoutEffect, useRef } from "react";
import { useForceUpdate } from "../hooks/useForceUpdate.js";
/**
 * Like `useLayoutEffect`, but all effect executions are run
 * *after* the `DeferredLayoutEffectsProvider` layout effects
 * phase.
 *
 * This hook allows child components to enqueue layout effects
 * that won't be safe to run until after a parent component's
 * layout effects have run.
 *
 */ const useLayoutGroupEffectsRegistry = ()=>{
    const createQueue = useRef(new Set()).current;
    const destroyQueue = useRef(new Set()).current;
    const forceUpdate = useForceUpdate();
    const isUpdatePending = useRef(true);
    const ensureFlush = useCallback(()=>{
        if (!isUpdatePending.current) {
            forceUpdate();
            isUpdatePending.current = true;
        }
    }, [
        forceUpdate
    ]);
    const register = useCallback((effect)=>{
        let destroy;
        const create = ()=>{
            destroy = effect();
        };
        createQueue.add(create);
        ensureFlush();
        return ()=>{
            createQueue.delete(create);
            if (destroy) {
                destroyQueue.add(destroy);
                ensureFlush();
            }
        };
    }, [
        createQueue,
        destroyQueue,
        ensureFlush
    ]);
    useLayoutEffect(()=>{
        isUpdatePending.current = false;
        createQueue.forEach((create)=>create());
        createQueue.clear();
        return ()=>{
            destroyQueue.forEach((destroy)=>destroy());
            destroyQueue.clear();
        };
    });
    return register;
};
const LayoutGroupContext = /*#__PURE__*/ createContext(null);
/**
 * Provides a deferral point for deferred layout effects.
 * All effects registered with `useDeferredLayoutEffect`
 * by children of this provider will execute *after* all
 * effects registered by `useLayoutEffect` by children of
 * this provider.
 */ export function LayoutGroup(param) {
    let { children  } = param;
    const register = useLayoutGroupEffectsRegistry();
    return /*#__PURE__*/ React.createElement(LayoutGroupContext.Provider, {
        value: register
    }, children);
}
/**
 * Like `useLayoutEffect`, but all effect executions are run
 * *after* the `DeferredLayoutEffectsProvider` layout effects
 * phase.
 *
 * This hook allows child components to enqueue layout effects
 * that won't be safe to run until after a parent component's
 * layout effects have run.
 */ export function useLayoutGroupEffect(effect, deps) {
    const register = useContext(LayoutGroupContext);
    // The rule for hooks wants to statically verify the deps,
    // but the dependencies are up to the caller, not this implementation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useLayoutEffect(()=>register(effect), deps);
}
