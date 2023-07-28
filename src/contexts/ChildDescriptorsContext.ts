import { createContext } from "react";

import { ViewDesc } from "../descriptors/ViewDesc.js";

export const ChildDescriptorsContext = createContext<ViewDesc[]>([]);
