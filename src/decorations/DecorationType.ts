import { Mappable } from "prosemirror-transform";
import { Decoration } from "prosemirror-view";

import { DOMNode } from "../dom.js";

export interface DecorationType {
  spec: any;
  map(
    mapping: Mappable,
    span: Decoration,
    offset: number,
    oldOffset: number
  ): Decoration | null;
  valid(node: Node, span: Decoration): boolean;
  eq(other: DecorationType): boolean;
  destroy(dom: DOMNode): void;
}
