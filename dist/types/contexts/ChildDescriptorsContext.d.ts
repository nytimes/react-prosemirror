import { MutableRefObject } from "react";
import { ViewDesc } from "../viewdesc.js";
export declare const ChildDescriptorsContext: import("react").Context<{
    parentRef: MutableRefObject<ViewDesc | undefined>;
    siblingsRef: MutableRefObject<ViewDesc[]>;
}>;
