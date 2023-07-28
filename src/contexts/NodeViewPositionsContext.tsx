import { createContext } from "react";

import { DOMNode } from "../dom.js";

export type NodeViewDescriptor = {
  pos: number;
  dom: DOMNode;
  contentDOM: DOMNode | null;
};

export type NodeViewDescriptorsContextValue = {
  mount: HTMLDivElement | null;
  domToDesc: Map<DOMNode, NodeViewDescriptor>;
  posToDesc: Map<number, NodeViewDescriptor>;
};

export const NodeViewDescriptorsContext = createContext(
  null as unknown as NodeViewDescriptorsContextValue
);
