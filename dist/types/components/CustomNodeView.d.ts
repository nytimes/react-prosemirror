import { Node } from "prosemirror-model";
import { Decoration, DecorationSource, NodeViewConstructor, NodeView as NodeViewT } from "prosemirror-view";
import React, { MutableRefObject } from "react";
interface Props {
    customNodeViewRootRef: MutableRefObject<HTMLDivElement | null>;
    customNodeViewRef: MutableRefObject<NodeViewT | null>;
    contentDomRef: MutableRefObject<HTMLElement | null>;
    customNodeView: NodeViewConstructor;
    initialNode: MutableRefObject<Node>;
    node: Node;
    getPos: MutableRefObject<() => number>;
    initialOuterDeco: MutableRefObject<readonly Decoration[]>;
    initialInnerDeco: MutableRefObject<DecorationSource>;
    innerDeco: DecorationSource;
}
export declare function CustomNodeView({ contentDomRef, customNodeViewRef, customNodeViewRootRef, customNodeView, initialNode, node, getPos, initialOuterDeco, initialInnerDeco, innerDeco, }: Props): React.DetailedReactHTMLElement<{
    ref: React.MutableRefObject<HTMLDivElement | null>;
    contentEditable: boolean;
    suppressContentEditableWarning: true;
}, HTMLDivElement> | null;
export {};
