import { Node } from "prosemirror-model";
import { Decoration, DecorationSource } from "prosemirror-view";
import { DecorationType } from "../decorations/DecorationType";
import { ReactWidgetType } from "../decorations/ReactWidgetType";

export interface DecorationInternal extends Decoration {
  type: DecorationType
  inline: boolean
}

export interface ReactWidgetDecoration extends Decoration {
  type: ReactWidgetType
  inline: false
}

export interface DecorationSourceInternal extends DecorationSource {
  locals(node: Node): readonly Decoration[]
  forChild(offset: number, child: Node): DecorationSourceInternal
  eq(other: DecorationSource): boolean
}
