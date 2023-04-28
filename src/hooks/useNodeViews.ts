import { ComponentType, useMemo } from "react";

import {
  NodeViewComponentProps,
  createReactNodeViewConstructor,
} from "../nodeViews/createReactNodeViewConstructor.js";

import { useNodeViewPortals } from "./useNodeViewPortals.js";

export function useNodeViews(
  nodeViews: Record<string, ComponentType<NodeViewComponentProps>>
) {
  const { registerPortal, portals } = useNodeViewPortals();

  const reactNodeViews = useMemo(() => {
    const nodeViewEntries = Object.entries(nodeViews);
    const reactNodeViewEntries = nodeViewEntries.map(([name, constructor]) => [
      name,
      createReactNodeViewConstructor(constructor, registerPortal),
    ]);
    return Object.fromEntries(reactNodeViewEntries);
  }, [nodeViews, registerPortal]);

  return { nodeViews: reactNodeViews, renderNodeViews: () => portals };
}
