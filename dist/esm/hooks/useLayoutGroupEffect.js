import { useContext, useLayoutEffect } from "react";
import { LayoutGroupContext } from "../contexts/LayoutGroupContext.js";
/** Registers a layout effect to run at the nearest `LayoutGroup` boundary. */ export function useLayoutGroupEffect(effect, deps) {
    const register = useContext(LayoutGroupContext);
    // The rule for hooks wants to statically verify the deps,
    // but the dependencies are up to the caller, not this implementation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useLayoutEffect(()=>register(effect), deps);
}
