import type { DependencyList, EffectCallback } from "react";
/** Registers a layout effect to run at the nearest `LayoutGroup` boundary. */
export declare function useLayoutGroupEffect(effect: EffectCallback, deps?: DependencyList): void;
