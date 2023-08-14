import { ForwardRefExoticComponent, RefAttributes, createContext } from "react";

import { NodeViewComponentProps } from "../components/NodeViewComponentProps.js";

export type NodeViewContextValue = {
  nodeViews: Record<
    string,
    ForwardRefExoticComponent<
      NodeViewComponentProps & RefAttributes<HTMLElement>
    >
  >;
};

export const NodeViewContext = createContext(
  null as unknown as NodeViewContextValue
);
