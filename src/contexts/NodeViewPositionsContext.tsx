import { createContext } from "react";

export type NodeViewPositionsContextValue = {
  mount: HTMLDivElement | null;
  domToPos: Map<Element | Text, number>;
  posToDOM: Map<number, Element | Text>;
};

export const NodeViewPositionsContext = createContext(
  null as unknown as NodeViewPositionsContextValue
);
