import { Node } from "prosemirror-model";
import { Decoration, DecorationSource } from "prosemirror-view";
import { DecorationType } from "../decorations/DecorationType.js";
import { ReactWidgetType } from "../decorations/ReactWidgetType.js";

export interface NonWidgetType extends DecorationType {
  attrs: {
    nodeName?: string;
    class?: string;
    style?: string;
    [attr: string]: string | undefined;
  };
}

export interface DecorationInternal extends Decoration {
  type: NonWidgetType | ReactWidgetType;
  inline: boolean;
}

export interface ReactWidgetDecoration extends Decoration {
  type: ReactWidgetType;
  inline: false;
}

export interface DecorationSourceInternal extends DecorationSource {
  locals(node: Node): readonly DecorationInternal[];
  forChild(offset: number, child: Node): DecorationSourceInternal;
  eq(other: DecorationSource): boolean;
}

export interface DecorationSetInternal extends DecorationSourceInternal {
  local: DecorationInternal[];
  children: DecorationSetInternal[];
  find(): DecorationInternal[];
}
