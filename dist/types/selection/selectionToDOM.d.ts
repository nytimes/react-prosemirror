import { Selection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
export declare const isEquivalentPosition: (node: Node, off: number, targetNode: Node, targetOff: number) => boolean;
export declare function hasBlockDesc(dom: Node): boolean | null | undefined;
export declare const domIndex: (node: Node) => number;
export declare function nodeSize(node: Node): number;
export declare function syncNodeSelection(view: EditorView, sel: Selection): void;
export declare function hasSelection(view: EditorView): boolean;
export declare function selectionToDOM(view: EditorView, force?: boolean): void;
