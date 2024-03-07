import { ReactPortal } from "react";
import { NodeKey } from "../plugins/react.js";
export type RegisteredPortal = {
    getPos: () => number;
    portal: ReactPortal;
};
export type PortalRegistry = Record<NodeKey, RegisteredPortal[]>;
/**
 * A map of node view keys to portals.
 *
 * Each node view registers a portal under its parent's
 * key. Each can then retrieve the list of portals under their
 * key, allowing portals to be rendered with the appropriate
 * hierarchy.
 */
export declare const PortalRegistryContext: import("react").Context<PortalRegistry>;
