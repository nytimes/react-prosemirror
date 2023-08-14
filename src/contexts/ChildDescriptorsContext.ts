import { createContext } from "react";

import { ViewDesc } from "../prosemirror-view/viewdesc.js";

export const ChildDescriptorsContext = createContext<ViewDesc[]>([]);
