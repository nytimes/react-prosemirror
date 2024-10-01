import { Node } from "prosemirror-model";
import { Decoration, DecorationSource } from "prosemirror-view";
import { HTMLAttributes, ReactNode } from "react";
export type NodeViewComponentProps = {
    nodeProps: {
        decorations: readonly Decoration[];
        innerDecorations: DecorationSource;
        node: Node;
        children?: ReactNode | ReactNode[];
        isSelected: boolean;
        getPos: () => number;
    };
} & HTMLAttributes<HTMLElement>;
