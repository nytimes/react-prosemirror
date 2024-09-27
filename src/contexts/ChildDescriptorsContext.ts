import { MutableRefObject, createContext } from "react";

import { ViewDesc } from "../viewdesc.js";

export const ChildDescriptorsContext = createContext<{
  parentRef: MutableRefObject<ViewDesc | undefined>;
  siblingsRef: MutableRefObject<ViewDesc[]>;
}>({
  parentRef: { current: undefined },
  siblingsRef: {
    current: [],
  },
});
