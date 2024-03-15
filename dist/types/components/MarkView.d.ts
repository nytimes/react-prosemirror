import { Mark } from "prosemirror-model";
import React, { ReactNode } from "react";
type Props = {
    mark: Mark;
    children: ReactNode;
};
export declare const MarkView: React.ForwardRefExoticComponent<Props & React.RefAttributes<unknown>>;
export {};
