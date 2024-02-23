import React, { createContext, useContext } from "react";
import type { ReactNode } from "react";

import { reactPluginKey } from "../plugins/react.js";
import type { NodeKey } from "../plugins/react.js";

import { useEditorState } from "./useEditorState.js";

type Props = {
  nodeKey: NodeKey;
  children: ReactNode;
};

const NodePosContext = createContext<number>(null as unknown as number);

export function NodePosProvider({ nodeKey, children }: Props) {
  const editorState = useEditorState();
  const pluginState = reactPluginKey.getState(editorState);
  if (!pluginState) return <>{children}</>;
  return (
    <NodePosContext.Provider value={pluginState.keyToPos.get(nodeKey) ?? 0}>
      {children}
    </NodePosContext.Provider>
  );
}

export function useNodePos() {
  return useContext(NodePosContext);
}
