import { ForwardRefExoticComponent, RefAttributes } from "react";
import { NodeViewComponentProps } from "../components/NodeViewComponentProps.js";
export type NodeViewContextValue = {
    nodeViews: Record<string, ForwardRefExoticComponent<NodeViewComponentProps & RefAttributes<HTMLElement>>>;
};
export declare const NodeViewContext: import("react").Context<NodeViewContextValue>;
