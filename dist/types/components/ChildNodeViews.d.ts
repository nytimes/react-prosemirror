import { Node } from "prosemirror-model";
import { Decoration, DecorationSource } from "prosemirror-view";
import React from "react";
export declare function wrapInDeco(reactNode: JSX.Element | string, deco: Decoration): React.DetailedReactHTMLElement<React.HTMLProps<HTMLElement>, HTMLElement> | React.FunctionComponentElement<any>;
export declare function ChildNodeViews({ pos, node, innerDecorations, }: {
    pos: number;
    node: Node | undefined;
    innerDecorations: DecorationSource;
}): JSX.Element | null;
