import { useMemo } from "react";

import {
  InnerNodeViewConstructor,
  createReactNodeViewConstructor,
} from "../nodeViews/createReactNodeViewConstructor";

import { useNodeViewPortals } from "./useNodeViewPortals";

export function useNodeViews(
  nodeViews: Record<string, InnerNodeViewConstructor>
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
