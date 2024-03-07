import { ReactNode } from "react";
import { NodeKey } from "../plugins/react.js";
type Props = {
    nodeKey: NodeKey;
    children: ReactNode;
};
export declare function NodePosProvider({ nodeKey, children }: Props): JSX.Element;
export declare function useNodePos(): number;
export {};
