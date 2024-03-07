import { DOMOutputSpec } from "prosemirror-model";
import React, { ReactNode } from "react";
type Props = {
    outputSpec: DOMOutputSpec;
    children?: ReactNode;
};
declare const ForwardedOutputSpec: React.ForwardRefExoticComponent<Props & React.RefAttributes<unknown>>;
export { ForwardedOutputSpec as OutputSpec };
