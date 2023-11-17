import { createContext } from "react";

import { ViewDesc } from "../viewdesc.js";

export const ChildDescriptorsContext = createContext<ViewDesc[]>([]);
