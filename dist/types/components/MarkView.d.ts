import { Mark } from "prosemirror-model";
import React, { MutableRefObject, ReactNode } from "react";
type Props = {
    mark: Mark;
    getPos: MutableRefObject<() => number>;
    children: ReactNode;
};
export declare const MarkView: React.MemoExoticComponent<React.ForwardRefExoticComponent<Props & React.RefAttributes<unknown>>>;
export {};
