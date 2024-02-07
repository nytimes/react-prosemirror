import { EditorView } from "prosemirror-view";
import React, { ReactPortal, useCallback, useMemo, useState } from "react";

import { NodeViews } from "../components/NodeViews.js";
import type { NodeViewsContextValue } from "../components/NodeViewsContext.js";
import {
  ReactNodeViewConstructor,
  RegisterPortal,
  createReactNodeViewConstructor,
  findNodeKeyUp,
} from "../nodeViews/createReactNodeViewConstructor.js";

export function useNodeViews(
  nodeViews: Record<string, ReactNodeViewConstructor>
) {
  const [portals, setPortals] = useState({} as NodeViewsContextValue);

  const registerPortal: RegisterPortal = useCallback(
    (view: EditorView, getPos: () => number, portal: ReactPortal) => {
      const nearestAncestorKey = findNodeKeyUp(view, getPos());

      setPortals((oldPortals) => {
        const oldChildPortals = oldPortals[nearestAncestorKey] ?? [];
        const newChildPortals = oldChildPortals.concat({ getPos, portal });
        return {
          ...oldPortals,
          [nearestAncestorKey]: newChildPortals,
        };
      });

      return () => {
        setPortals((oldPortals) => {
          const oldChildPortals = oldPortals[nearestAncestorKey] ?? [];
          const newChildPortals = oldChildPortals.filter(
            ({ portal: p }) => p !== portal
          );
          return {
            ...oldPortals,
            [nearestAncestorKey]: newChildPortals,
          };
        });
      };
    },
    []
  );

  const reactNodeViews = useMemo(() => {
    const nodeViewEntries = Object.entries(nodeViews);
    const reactNodeViewEntries = nodeViewEntries.map(([name, constructor]) => [
      name,
      createReactNodeViewConstructor(constructor, registerPortal),
    ]);
    return Object.fromEntries(reactNodeViewEntries);
  }, [nodeViews, registerPortal]);

  return {
    nodeViews: reactNodeViews,
    renderNodeViews: () => <NodeViews portals={portals} />,
  };
}
