import { Node } from "prosemirror-model";
import { Decoration, DecorationSource } from "prosemirror-view";
import { ReactNode } from "react";

export type NodeViewComponentProps = {
  decorations: readonly Decoration[];
  innerDecorations: DecorationSource;
  node: Node;
  children?: ReactNode | ReactNode[];
  isSelected: boolean;
  pos: number;
};
