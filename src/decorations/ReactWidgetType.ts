import { Mark } from "prosemirror-model";
import { Mappable } from "prosemirror-transform";
import { Decoration } from "prosemirror-view";
import { ForwardRefExoticComponent, RefAttributes } from "react";

import { WidgetViewComponentProps } from "../components/WidgetViewComponentProps.js";
import { DOMNode } from "../dom.js";

function compareObjs(
  a: { [prop: string]: unknown },
  b: { [prop: string]: unknown }
) {
  if (a == b) return true;
  for (const p in a) if (a[p] !== b[p]) return false;
  for (const p in b) if (!(p in a)) return false;
  return true;
}

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

export type DecorationWithType = Decoration & {
  type: DecorationType;
};

type ReactWidgetSpec = {
  side?: number;
  marks?: readonly Mark[];
  stopEvent?: (event: Event) => boolean;
  ignoreSelection?: boolean;
  key?: string;
};

const noSpec = { side: 0 };

export class ReactWidgetType implements DecorationType {
  side: number;
  spec: ReactWidgetSpec;

  constructor(
    public Component: ForwardRefExoticComponent<
      RefAttributes<HTMLElement> & WidgetViewComponentProps
    >,
    spec?: ReactWidgetSpec
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
    // @ts-expect-error The Decoration constructor is private/internal, but
    // we need to use it for our custom widget implementation here.
    return deleted ? null : new Decoration(pos - offset, pos - offset, this);
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

export function widget<E extends HTMLElement>(
  pos: number,
  component: ForwardRefExoticComponent<
    RefAttributes<E> & WidgetViewComponentProps
  >,
  spec?: ReactWidgetSpec
) {
  // @ts-expect-error The Decoration constructor is private/internal, but
  // we need to use it for our custom widget implementation here.
  return new Decoration(pos, pos, new ReactWidgetType(component, spec));
}

export interface ReactWidgetDecoration extends Decoration {
  type: ReactWidgetType;
  inline: false;
}
