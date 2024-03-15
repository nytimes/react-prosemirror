import type { EffectCallback } from "react";
export interface LayoutGroupContextValue {
    (effect: EffectCallback): ReturnType<EffectCallback>;
}
export declare const LayoutGroupContext: import("react").Context<LayoutGroupContextValue>;
