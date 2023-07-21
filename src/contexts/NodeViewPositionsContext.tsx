import { createContext } from "react";

export type NodeViewPositionsContextValue = {
  mount: HTMLDivElement | null;
  domToPos: Map<Node, number>;
  posToDOM: Map<number, Node>;
};

export const NodeViewPositionsContext = createContext(
  null as unknown as NodeViewPositionsContextValue
);
