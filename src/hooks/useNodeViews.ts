import { useMemo } from "react";

import {
  ReactNodeViewConstructor,
  createReactNodeViewConstructor,
} from "../nodeViews/createReactNodeViewConstructor";

import { useNodeViewPortals } from "./useNodeViewPortals";

export function useNodeViews(
  nodeViews: Record<string, ReactNodeViewConstructor>
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
