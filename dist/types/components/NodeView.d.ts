import { Node } from "prosemirror-model";
import { Decoration, DecorationSource } from "prosemirror-view";
import React, { MutableRefObject } from "react";
type NodeViewProps = {
    outerDeco: readonly Decoration[];
    getPos: MutableRefObject<() => number>;
    node: Node;
    innerDeco: DecorationSource;
};
export declare const NodeView: React.NamedExoticComponent<NodeViewProps>;
export {};
