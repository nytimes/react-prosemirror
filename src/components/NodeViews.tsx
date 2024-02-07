import React, { useState } from "react";
import type { ReactPortal } from "react";

import { useEditorEffect } from "../hooks/useEditorEffect.js";
import { ROOT_NODE_KEY } from "../plugins/react.js";

import { NodeViewsContext } from "./NodeViewsContext.js";
import type { NodeViewsContextValue } from "./NodeViewsContext.js";

type NodeViewsProps = {
  portals: NodeViewsContextValue;
};

export function NodeViews({ portals }: NodeViewsProps) {
  const rootRegisteredPortals = portals[ROOT_NODE_KEY];
  const [rootPortals, setRootPortals] = useState<ReactPortal[]>(
    rootRegisteredPortals?.map(({ portal }) => portal) ?? []
  );

  // `getPos` is technically derived from the EditorView
  // state, so it's not safe to call until after the EditorView
  // has been updated
  useEditorEffect(() => {
    setRootPortals(
      rootRegisteredPortals
        ?.sort((a, b) => a.getPos() - b.getPos())
        .map(({ portal }) => portal) ?? []
    );
  }, [rootRegisteredPortals]);

  return (
    <NodeViewsContext.Provider value={portals}>
      {rootPortals}
    </NodeViewsContext.Provider>
  );
}
