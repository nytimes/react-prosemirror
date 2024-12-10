import { createContext } from "react";

type StopEventContextValue = (
  stopEvent: (event: Event) => boolean | undefined
) => void;

export const StopEventContext = createContext<StopEventContextValue>(
  null as unknown as StopEventContextValue
);
