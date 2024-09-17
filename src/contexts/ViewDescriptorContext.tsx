import { createContext } from "react";

import { ViewDesc } from "../viewdesc.js";

export const ViewDescriptorContext = createContext<Record<string, ViewDesc>>(
  {}
);
