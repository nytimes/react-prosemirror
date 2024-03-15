export type DOMNode = InstanceType<typeof window.Node>;
export type DOMSelection = InstanceType<typeof window.Selection>;
export type DOMSelectionRange = {
    focusNode: DOMNode | null;
    focusOffset: number;
    anchorNode: DOMNode | null;
    anchorOffset: number;
};
export declare const domIndex: (node: Node) => number;
export declare const parentNode: (node: Node) => Node | null;
export declare const textRange: (node: Text, from?: number, to?: number) => Range;
export declare const isEquivalentPosition: (node: Node, off: number, targetNode: Node, targetOff: number) => boolean;
export declare function nodeSize(node: Node): number;
export declare function isOnEdge(node: Node, offset: number, parent: Node): boolean;
export declare function hasBlockDesc(dom: Node): boolean | null | undefined;
export declare const selectionCollapsed: (domSel: DOMSelectionRange) => boolean | null;
export declare function keyEvent(keyCode: number, key: string): KeyboardEvent;
export declare function deepActiveElement(doc: Document): Element | null;
export declare function caretFromPoint(doc: Document, x: number, y: number): {
    node: Node;
    offset: number;
} | undefined;
