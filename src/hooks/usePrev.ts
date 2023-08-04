import { useRef } from "react";

export function usePrevious<Value>(value: Value): Value | null {
  const ref = useRef<Value | null>(null);
  const prev = ref.current;
  ref.current = value;
  return prev;
}
