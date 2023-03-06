import { useMemo } from "react";

import {
  ReactNodeViewConstructor,
  createReactNodeViewConstructor,
} from "../nodeViews/createReactNodeViewConstructor";

export function useNodeViews(
  nodeViews: Record<string, ReactNodeViewConstructor>
) {
  const reactNodeViews = useMemo(() => {
    const nodeViewEntries = Object.entries(nodeViews);
    const reactNodeViewEntries = nodeViewEntries.map(([name, constructor]) => [
      name,
      createReactNodeViewConstructor(constructor),
    ]);
    return Object.fromEntries(reactNodeViewEntries);
  }, [nodeViews]);

  return { nodeViews: reactNodeViews };
}
