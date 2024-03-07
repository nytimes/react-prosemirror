import { HTMLAttributes } from "react";
import { ReactWidgetDecoration } from "../decorations/ReactWidgetType.js";
export type WidgetViewComponentProps = {
    widget: ReactWidgetDecoration;
    pos: number;
} & HTMLAttributes<HTMLElement>;
