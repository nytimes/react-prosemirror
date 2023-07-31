import { Decoration } from "prosemirror-view";
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
