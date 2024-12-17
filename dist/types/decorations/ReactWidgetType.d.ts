import { Mark } from "prosemirror-model";
import { Mappable } from "prosemirror-transform";
import { Decoration } from "prosemirror-view";
import { ForwardRefExoticComponent, RefAttributes } from "react";
import { WidgetViewComponentProps } from "../components/WidgetViewComponentProps.js";
import { DOMNode } from "../dom.js";
export interface DecorationType {
    spec: unknown;
    map(mapping: Mappable, span: Decoration, offset: number, oldOffset: number): Decoration | null;
    valid(node: Node, span: Decoration): boolean;
    eq(other: DecorationType): boolean;
    destroy(dom: DOMNode): void;
}
export type DecorationWithType = Decoration & {
    type: DecorationType;
};
type ReactWidgetSpec = {
    side?: number;
    marks?: readonly Mark[];
    stopEvent?: (event: Event) => boolean;
    ignoreSelection?: boolean;
    key?: string;
};
export declare class ReactWidgetType implements DecorationType {
    Component: ForwardRefExoticComponent<RefAttributes<HTMLElement> & WidgetViewComponentProps>;
    side: number;
    spec: ReactWidgetSpec;
    constructor(Component: ForwardRefExoticComponent<RefAttributes<HTMLElement> & WidgetViewComponentProps>, spec?: ReactWidgetSpec);
    map(mapping: Mappable, span: Decoration, offset: number, oldOffset: number): Decoration | null;
    valid(): boolean;
    eq(other: DecorationType): boolean;
    destroy(): void;
}
export declare function widget<E extends HTMLElement>(pos: number, component: ForwardRefExoticComponent<RefAttributes<E> & WidgetViewComponentProps>, spec?: ReactWidgetSpec): Decoration;
export interface ReactWidgetDecoration extends Decoration {
    type: ReactWidgetType;
    inline: false;
}
export {};
