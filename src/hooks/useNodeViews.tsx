import React, { ReactPortal, useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import {
  PORTAL_REGISTRY_ROOT_KEY,
  PortalRegistryContext,
  PortalRegistryKey,
} from "../contexts/PortalRegistryContext.js";
import {
  ReactNodeViewConstructor,
  RegisterElement,
  createReactNodeViewConstructor,
} from "../nodeViews/createReactNodeViewConstructor.js";

type Props = {
  portals: Record<PortalRegistryKey, ReactPortal[]>;
};

function NodeViews({ portals }: Props) {
  const rootPortals = portals[PORTAL_REGISTRY_ROOT_KEY];

  return (
    <PortalRegistryContext.Provider value={portals}>
      {rootPortals}
    </PortalRegistryContext.Provider>
  );
}

export function useNodeViews(
  nodeViews: Record<string, ReactNodeViewConstructor>
) {
  const [portals, setPortals] = useState(
    {} as Record<PortalRegistryKey, ReactPortal[]>
  );

  const registerPortal: RegisterElement = useCallback(
    (registrationKey, child, container, key) => {
      const portal = createPortal(child, container, key);
      setPortals((oldPortals) => {
        const oldChildPortals = oldPortals[registrationKey] ?? [];
        const newChildPortals = oldChildPortals.concat(portal);
        return {
          ...oldPortals,
          [registrationKey]: newChildPortals,
        };
      });

      return () => {
        setPortals((oldPortals) => {
          const oldChildPortals = oldPortals[registrationKey] ?? [];
          const newChildPortals = oldChildPortals.filter((p) => p !== portal);
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
