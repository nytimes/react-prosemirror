import { Node } from "prosemirror-model";
import { Decoration, DecorationSource } from "prosemirror-view";
import React, { DetailedHTMLProps, HTMLAttributes, ReactElement } from "react";
import { NodeViewDesc } from "../viewdesc.js";
export type DocNodeViewProps = {
    className?: string;
    node: Node | undefined;
    innerDeco: DecorationSource;
    outerDeco: Decoration[];
    as?: ReactElement;
    viewDesc?: NodeViewDesc;
} & Omit<DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLDivElement>, "ref">;
export declare const DocNodeView: React.MemoExoticComponent<React.ForwardRefExoticComponent<{
    className?: string | undefined;
    node: Node | undefined;
    innerDeco: DecorationSource;
    outerDeco: Decoration[];
    as?: React.ReactElement<any, string | React.JSXElementConstructor<any>> | undefined;
    viewDesc?: NodeViewDesc | undefined;
} & Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement | null>>>;
