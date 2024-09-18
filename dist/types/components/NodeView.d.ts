import { Node } from "prosemirror-model";
import { Decoration, DecorationSource } from "prosemirror-view";
type NodeViewProps = {
    outerDeco: readonly Decoration[];
    pos: number;
    node: Node;
    innerDeco: DecorationSource;
};
export declare function NodeView({ outerDeco, pos, node, innerDeco, ...props }: NodeViewProps): JSX.Element;
export {};
