import { Node } from "prosemirror-model";
import { Mapping } from "prosemirror-transform";
import { Decoration, DecorationSet, DecorationSource } from "prosemirror-view";
export interface InternalDecorationSource {
    map: (mapping: Mapping, node: Node) => DecorationSource;
    locals(node: Node): readonly Decoration[];
    forChild(offset: number, child: Node): DecorationSource;
    eq(other: DecorationSource): boolean;
    forEachSet(f: (set: DecorationSet) => void): void;
}
export interface InternalDecorationSet extends InternalDecorationSource {
    localsInner(node: Node): readonly Decoration[];
}
export interface InternalDecoration extends Decoration {
    copy(from: number, to: number): Decoration;
}
