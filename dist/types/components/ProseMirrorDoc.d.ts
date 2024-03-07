import React, { ReactElement } from "react";
import { DocNodeViewProps } from "./DocNodeView.js";
type DocNodeViewContextValue = Omit<DocNodeViewProps, "as"> & {
    setMount: (mount: HTMLElement | null) => void;
};
export declare const DocNodeViewContext: React.Context<DocNodeViewContextValue>;
type Props = {
    as?: ReactElement;
};
declare const ForwardedProseMirrorDoc: React.ForwardRefExoticComponent<Props & React.RefAttributes<HTMLDivElement | null>>;
export { ForwardedProseMirrorDoc as ProseMirrorDoc };
