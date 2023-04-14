import { ReactPortal, useCallback, useState } from "react";
import { createPortal } from "react-dom";

import { RegisterElement } from "../nodeViews/createReactNodeViewConstructor.js";

/**
 * Provides an array of React portals and a callback for registering
 * new portals.
 *
 * The `registerPortal` callback is meant to be passed to
 * `createNodeViewConstructor` as the `registerElement` argument. The
 * `portals` array should be passed as children to the `ProseMirror`
 * component.
 */
export function useNodeViewPortals() {
  const [portals, setPortals] = useState<ReactPortal[]>([]);

  const registerPortal: RegisterElement = useCallback(
    (child, container, key) => {
      const portal = createPortal(child, container, key);
      setPortals((oldPortals) => oldPortals.concat(portal));
      return () => {
        setPortals((oldPortals) => oldPortals.filter((p) => p !== portal));
      };
    },
    []
  );

  return { portals, registerPortal };
}
