import { Mappable } from "prosemirror-transform";
import { Decoration } from "prosemirror-view";

import { DOMNode } from "../prosemirror-view/dom.js";

export interface DecorationType {
  spec: unknown;
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
