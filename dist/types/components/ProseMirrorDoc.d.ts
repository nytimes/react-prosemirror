import React from "react";
import { DocNodeViewProps } from "./DocNodeView.js";
type DocNodeViewContextValue = Omit<DocNodeViewProps, "as"> & {
    setMount: (mount: HTMLElement | null) => void;
};
export declare const DocNodeViewContext: React.Context<DocNodeViewContextValue>;
declare const ForwardedProseMirrorDoc: React.ForwardRefExoticComponent<{
    as?: React.ReactElement<any, string | React.JSXElementConstructor<any>> | undefined;
} & Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement | null>>;
export { ForwardedProseMirrorDoc as ProseMirrorDoc };
