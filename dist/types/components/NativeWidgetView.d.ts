import { Decoration } from "prosemirror-view";
import { MutableRefObject } from "react";
type Props = {
    widget: Decoration;
    getPos: MutableRefObject<() => number>;
};
export declare function NativeWidgetView({ widget, getPos }: Props): JSX.Element;
export {};
