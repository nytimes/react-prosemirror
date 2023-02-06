import { useReducer } from "react";

/**
 * Provides a function that forces an update of the
 * component.
 */
export function useForceUpdate(): () => void {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  return forceUpdate;
}
