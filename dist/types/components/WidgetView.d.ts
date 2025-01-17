import { MutableRefObject } from "react";
import { ReactWidgetDecoration } from "../decorations/ReactWidgetType.js";
type Props = {
    widget: ReactWidgetDecoration;
    getPos: MutableRefObject<() => number>;
};
export declare function WidgetView({ widget, getPos }: Props): JSX.Element;
export {};
