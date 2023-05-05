import { Node } from "prosemirror-model";
import React, {
  ReactPortal,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";

import {
  PORTAL_REGISTRY_ROOT_KEY,
  PortalRegistry,
  PortalRegistryContext,
} from "../contexts/PortalRegistryContext.js";
import {
  PlainNodeView,
  ReactNodeViewConstructor,
  RegisterElement,
  createReactNodeViewConstructor,
} from "../nodeViews/createReactNodeViewConstructor.js";
import { reactNodeViewPlugin } from "../plugins/reactNodeViewPlugin.js";

import { useEditorEffect } from "./useEditorEffect.js";
import { useEditorState } from "./useEditorState.js";

type NodeViewsProps = {
  portals: Record<string, ReactPortal>;
};

function NodeViews({ portals }: NodeViewsProps) {
  const [doc, setDoc] = useState<Node | null>(null);

  useEditorEffect((view) => {
    if (!view) return;

    setDoc(view.state.doc);
  });

  return (
    <PortalRegistryContext.Provider value={portals}>
      {doc && <PlainNodeView node={doc} pos={-1} />}
    </PortalRegistryContext.Provider>
  );
}

export function useNodeViews(
  nodeViews: Record<string, ReactNodeViewConstructor>
) {
  const [portals, setPortals] = useState({} as Record<string, ReactPortal>);

  const registerPortal: RegisterElement = useCallback(
    (child, container, key) => {
      const portal = createPortal(child, container, key);
      setPortals((oldPortals) => ({
        ...oldPortals,
        [key!]: portal,
      }));

      return () => {
        setPortals((oldPortals) => {
          const { [key!]: _, ...newPortals } = oldPortals;
          return newPortals;
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
