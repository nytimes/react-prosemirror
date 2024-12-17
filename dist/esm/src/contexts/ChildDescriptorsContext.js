import { createContext } from "react";
export const ChildDescriptorsContext = createContext({
    parentRef: {
        current: undefined
    },
    siblingsRef: {
        current: []
    }
});
