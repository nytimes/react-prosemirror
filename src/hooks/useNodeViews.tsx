import React, { ReactPortal, useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import {
  PORTAL_REGISTRY_ROOT_KEY,
  PortalRegistry,
  PortalRegistryContext,
} from "../contexts/PortalRegistryContext.js";
import {
  ReactNodeViewConstructor,
  RegisterElement,
  createReactNodeViewConstructor,
} from "../nodeViews/createReactNodeViewConstructor.js";

import { useEditorEffect } from "./useEditorEffect.js";

type Props = {
  portals: PortalRegistry;
};

function NodeViews({ portals }: Props) {
  const rootRegisteredPortals = portals[PORTAL_REGISTRY_ROOT_KEY];
  const [rootPortals, setRootPortals] = useState<ReactPortal[]>(
    rootRegisteredPortals.map(({ portal }) => portal)
  );

  // `getPos` is technically derived from the EditorView
  // state, so it's not safe to call until after the EditorView
  // has been updated
  useEditorEffect(() => {
    setRootPortals(
      rootRegisteredPortals
        ?.sort((a, b) => a.getPos() - b.getPos())
        .map(({ portal }) => portal)
    );
  }, [rootRegisteredPortals]);

  return (
    <PortalRegistryContext.Provider value={portals}>
      {rootPortals}
    </PortalRegistryContext.Provider>
  );
}

export function useNodeViews(
  nodeViews: Record<string, ReactNodeViewConstructor>
) {
  const [portals, setPortals] = useState({} as PortalRegistry);

  const registerPortal: RegisterElement = useCallback(
    (registrationKey, getPos, child, container, key) => {
      const portal = createPortal(child, container, key);
      setPortals((oldPortals) => {
        const oldChildPortals = oldPortals[registrationKey] ?? [];
        const newChildPortals = oldChildPortals.concat({ getPos, portal });
        return {
          ...oldPortals,
          [registrationKey]: newChildPortals,
        };
      });

      return () => {
        setPortals((oldPortals) => {
          const oldChildPortals = oldPortals[registrationKey] ?? [];
          const newChildPortals = oldChildPortals.filter(
            ({ portal: p }) => p !== portal
          );
          return {
            ...oldPortals,
            [registrationKey]: newChildPortals,
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
