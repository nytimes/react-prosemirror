import { Node } from "prosemirror-model";
import { Decoration, DecorationSource } from "prosemirror-view";
export declare function iterDeco(parent: Node, deco: DecorationSource, onWidget: (widget: Decoration, isNative: boolean, offset: number, index: number, insideNode: boolean) => void, onNode: (node: Node, outerDeco: readonly Decoration[], innerDeco: DecorationSource, offset: number, index: number) => void): void;
