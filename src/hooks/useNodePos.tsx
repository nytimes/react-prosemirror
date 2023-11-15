import React, { ReactNode, createContext, useContext } from "react";

import { NodeKey, reactPluginKey } from "../plugins/react.js";

import { useEditorState } from "./useEditorState.js";

type Props = {
  nodeKey: NodeKey;
  children: ReactNode;
};

const NodePosContext = createContext<number>(null as unknown as number);

export function NodePosProvider({ nodeKey, children }: Props) {
  const editorState = useEditorState();
  if (!editorState) return <>{children}</>;
  const pluginState = reactPluginKey.getState(editorState);
  return (
    <NodePosContext.Provider value={pluginState?.keyToPos.get(nodeKey) ?? 0}>
      {children}
    </NodePosContext.Provider>
  );
}

export function useNodePos() {
  return useContext(NodePosContext);
}
