import { Node } from "prosemirror-model";
import { HTMLAttributes, ReactNode } from "react";

import { Decoration, DecorationSource } from "../prosemirror-view/index.js";

export type NodeViewComponentProps = {
  nodeProps: {
    decorations: readonly Decoration[];
    innerDecorations: DecorationSource;
    node: Node;
    children?: ReactNode | ReactNode[];
    isSelected: boolean;
    pos: number;
  };
} & HTMLAttributes<HTMLElement>;
