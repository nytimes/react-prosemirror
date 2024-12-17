import { DOMOutputSpec } from "prosemirror-model";
import React, { HTMLProps, ReactNode } from "react";
type Props = HTMLProps<HTMLElement> & {
    outputSpec: DOMOutputSpec;
    children?: ReactNode;
};
declare const ForwardedOutputSpec: React.MemoExoticComponent<React.ForwardRefExoticComponent<Omit<Props, "ref"> & React.RefAttributes<HTMLElement>>>;
export { ForwardedOutputSpec as OutputSpec };
