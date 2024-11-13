import { HTMLAttributes } from "react";
import { ReactWidgetDecoration } from "../decorations/ReactWidgetType.js";
export type WidgetViewComponentProps = {
    widget: ReactWidgetDecoration;
    getPos: () => number;
} & HTMLAttributes<HTMLElement>;
