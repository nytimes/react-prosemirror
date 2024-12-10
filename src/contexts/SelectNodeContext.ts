import { createContext } from "react";

type SelectNodeContextValue = (
  selectNode: () => void,
  deselectNode: () => void
) => void;

export const SelectNodeContext = createContext<SelectNodeContextValue>(
  null as unknown as SelectNodeContextValue
);
