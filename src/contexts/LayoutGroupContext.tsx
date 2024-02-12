import { createContext } from "react";
import type { EffectCallback } from "react";

export interface LayoutGroupContextValue {
  (effect: EffectCallback): ReturnType<EffectCallback>;
}

export const LayoutGroupContext = createContext(
  null as unknown as LayoutGroupContextValue
);
