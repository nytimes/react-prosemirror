import { Node } from "prosemirror-model";
import { Mapping } from "prosemirror-transform";
import { Decoration, DecorationSource } from "prosemirror-view";

export interface InternalDecorationSource {
  /// Map the set of decorations in response to a change in the
  /// document.
  map: (mapping: Mapping, node: Node) => DecorationSource;
  /// @internal
  locals(node: Node): readonly Decoration[];
  /// @internal
  forChild(offset: number, child: Node): DecorationSource;
  /// @internal
  eq(other: DecorationSource): boolean;
}

export interface InternalDecorationSet extends InternalDecorationSource {
  localsInner(node: Node): readonly Decoration[];
}

export interface InternalDecoration extends Decoration {
  copy(from: number, to: number): Decoration;
}
