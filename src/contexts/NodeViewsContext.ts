import { createContext } from "react";
import type { ReactPortal } from "react";

import type { NodeKey } from "../plugins/react";

type NodeViewRegistration = {
  getPos: () => number;
  portal: ReactPortal;
};

export interface NodeViewsContextValue {
  [key: NodeKey]: NodeViewRegistration[];
}

/**
 * A context containing a map of node view keys to portals.
 *
 * Each node view registers a portal under its parent's
 * key. Each can then retrieve the list of portals under their
 * key, allowing portals to be rendered with the appropriate
 * hierarchy.
 */
export const NodeViewsContext = createContext(
  null as unknown as NodeViewsContextValue
);
