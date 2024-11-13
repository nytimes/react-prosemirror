import { Node } from "prosemirror-model";
import { Decoration, DecorationSource } from "prosemirror-view";
import React, { MutableRefObject } from "react";
export declare function wrapInDeco(reactNode: JSX.Element | string, deco: Decoration): React.DetailedReactHTMLElement<React.HTMLProps<HTMLElement>, HTMLElement> | React.FunctionComponentElement<any>;
export declare const ChildNodeViews: React.NamedExoticComponent<{
    getPos: MutableRefObject<() => number>;
    node: Node | undefined;
    innerDecorations: DecorationSource;
}>;
