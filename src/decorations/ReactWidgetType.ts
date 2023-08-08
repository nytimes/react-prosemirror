import { Mark } from "prosemirror-model";
import { Mappable } from "prosemirror-transform";
import { Decoration } from "prosemirror-view";
import { ComponentType, ForwardRefExoticComponent, RefAttributes } from "react";

import { DecorationType } from "./DecorationType.js";

function compareObjs(
  a: { [prop: string]: unknown },
  b: { [prop: string]: unknown }
) {
  if (a == b) return true;
  for (const p in a) if (a[p] !== b[p]) return false;
  for (const p in b) if (!(p in a)) return false;
  return true;
}

type ReactWidgetSpec = {
  side: number;
  marks?: readonly Mark[];
  stopEvent?: (event: Event) => boolean;
  ignoreSelection?: boolean;
  key?: string;
};

const noSpec = {};

export class ReactWidgetType implements DecorationType {
  // TODO: implement side affinity?
  side: number;
  spec: ReactWidgetSpec;

  constructor(
    public Component: ForwardRefExoticComponent<
      RefAttributes<HTMLElement> & { contentEditable: boolean }
    >,
    spec: ReactWidgetSpec
  ) {
    this.spec = spec ?? noSpec;
    this.side = this.spec.side ?? 0;
  }

  map(
    mapping: Mappable,
    span: Decoration,
    offset: number,
    oldOffset: number
  ): Decoration | null {
    const { pos, deleted } = mapping.mapResult(
      span.from + oldOffset,
      this.side < 0 ? -1 : 1
    );
    return deleted
      ? null
      : // @ts-expect-error Decoration constructor args are internal
        new Decoration(pos - offset, pos - offset, this);
  }

  valid(): boolean {
    return true;
  }

  eq(other: DecorationType): boolean {
    return (
      this == other ||
      (other instanceof ReactWidgetType &&
        ((this.spec.key && this.spec.key == other.spec.key) ||
          (this.Component == other.Component &&
            compareObjs(this.spec, other.spec))))
    );
  }
  destroy(): void {
    // Can be implemented with React effect hooks
  }
}

export function widget(
  pos: number,
  component: ComponentType,
  spec: ReactWidgetSpec
) {
  // @ts-expect-error Decoration constructor args are internal
  return new Decoration(pos, pos, new ReactWidgetType(component, spec));
}
