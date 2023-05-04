import { ReactPortal, createContext } from "react";

export type RegisteredPortal = {
  getPos: () => number;
  portal: ReactPortal;
};

export type PortalRegistry = Record<PortalRegistryKey, RegisteredPortal[]>;

/**
 * A map of node view keys to portals.
 *
 * Each node view registers a portal under its parent's
 * key. Each can then retrieve the list of portals under their
 * key, allowing portals to be rendered with the appropriate
 * hierarchy.
 */
export const PortalRegistryContext = createContext<PortalRegistry>(
  null as unknown as PortalRegistry
);

/**
 * Node views that don't have any React node view ancestors
 * can specify their parent node view as the "root", and
 * will be have their portals rendered as direct children of
 * the ProseMirror component.
 */
export const PORTAL_REGISTRY_ROOT_KEY = Symbol("portal registry root key");

export type PortalRegistryKey = string | typeof PORTAL_REGISTRY_ROOT_KEY;
