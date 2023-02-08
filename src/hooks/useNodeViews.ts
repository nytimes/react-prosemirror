import { ComponentType, useMemo } from "react";

import {
  NodeViewComponentProps,
  PartialNodeViewConstructor,
  createReactNodeViewConstructor,
} from "../nodeViews/createReactNodeViewConstructor";

import { useNodeViewPortals } from "./useNodeViewPortals";

export function useNodeViews(
  nodeViews: Record<
    string,
    {
      constructor: PartialNodeViewConstructor;
      component: ComponentType<NodeViewComponentProps>;
    }
  >
) {
  const { registerPortal, portals } = useNodeViewPortals();

  const reactNodeViews = useMemo(() => {
    const nodeViewEntries = Object.entries(nodeViews);
    const reactNodeViewEntries = nodeViewEntries.map(
      ([name, { constructor, component }]) => [
        name,
        createReactNodeViewConstructor(component, registerPortal, constructor),
      ]
    );
    return Object.fromEntries(reactNodeViewEntries);
  }, [nodeViews, registerPortal]);

  return { nodeViews: reactNodeViews, renderNodeViews: () => portals };
}
