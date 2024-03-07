import { Node } from "prosemirror-model";
import { Decoration, DecorationSource } from "prosemirror-view";
import React, { ReactElement } from "react";
import { NodeViewDesc } from "../viewdesc.js";
export type DocNodeViewProps = {
    className?: string;
    node: Node | undefined;
    innerDeco: DecorationSource;
    outerDeco: Decoration[];
    as?: ReactElement;
    viewDesc?: NodeViewDesc;
};
export declare const DocNodeView: React.ForwardRefExoticComponent<DocNodeViewProps & React.RefAttributes<HTMLDivElement | null>>;
