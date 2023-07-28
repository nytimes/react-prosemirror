import { createContext } from "react";

import { ViewDesc } from "../descriptors/ViewDesc.js";
import { DOMNode } from "../dom.js";

export type NodeViewDescriptorsContextValue = {
  mount: HTMLDivElement | null;
  domToDesc: Map<DOMNode, ViewDesc>;
  posToDesc: Map<number, ViewDesc>;
};

export const NodeViewDescriptorsContext = createContext(
  null as unknown as NodeViewDescriptorsContextValue
);
