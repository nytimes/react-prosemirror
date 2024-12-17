import { NodeViewConstructor } from "prosemirror-view";
import { ForwardRefExoticComponent, ReactNode, RefAttributes } from "react";
import { UseEditorOptions } from "../hooks/useEditor.js";
import { NodeViewComponentProps } from "./NodeViewComponentProps.js";
export type Props = Omit<UseEditorOptions, "nodeViews"> & {
    className?: string;
    children?: ReactNode;
    nodeViews?: {
        [nodeType: string]: ForwardRefExoticComponent<NodeViewComponentProps & RefAttributes<any>>;
    };
    customNodeViews?: {
        [nodeType: string]: NodeViewConstructor;
    };
};
export declare function ProseMirror(props: Props): JSX.Element;
