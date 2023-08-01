import { Node } from "prosemirror-model";
import { Decoration } from "prosemirror-view";
import { ReactNode } from "react";

export type NodeViewComponentProps = {
  decorations: readonly Decoration[];
  node: Node;
  children?: ReactNode | ReactNode[];
  isSelected: boolean;
  pos: number;
};
