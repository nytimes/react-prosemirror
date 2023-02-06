import { ReactPortal, useCallback, useState } from "react";
import { createPortal } from "react-dom";

import { RegisterElement } from "../nodeViews/createReactNodeViewConstructor";

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
