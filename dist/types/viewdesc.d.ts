import { Mark, Node, ParseRule } from "prosemirror-model";
import { Decoration, DecorationSource, EditorView } from "prosemirror-view";
import { DOMNode } from "./dom.js";
export declare class ViewDesc {
    parent: ViewDesc | undefined;
    children: ViewDesc[];
    dom: DOMNode;
    contentDOM: HTMLElement | null;
    dirty: number;
    node: Node | null;
    constructor(parent: ViewDesc | undefined, children: ViewDesc[], dom: DOMNode, contentDOM: HTMLElement | null);
    matchesWidget(_widget: Decoration): boolean;
    matchesMark(_mark: Mark): boolean;
    matchesNode(_node: Node, _outerDeco: readonly Decoration[], _innerDeco: DecorationSource): boolean;
    matchesHack(nodeName: string): boolean;
    parseRule(): ParseRule | null;
    stopEvent(event: Event): boolean;
    get size(): number;
    get border(): number;
    destroy(): void;
    posBeforeChild(child: ViewDesc): number;
    get posBefore(): number;
    get posAtStart(): number;
    get posAfter(): number;
    get posAtEnd(): number;
    localPosFromDOM(dom: DOMNode, offset: number, bias: number): number;
    nearestDesc(dom: DOMNode): ViewDesc | undefined;
    nearestDesc(dom: DOMNode, onlyNodes: true): NodeViewDesc | undefined;
    getDesc(dom: DOMNode): ViewDesc | undefined;
    posFromDOM(dom: DOMNode, offset: number, bias: number): number;
    descAt(pos: number): ViewDesc | undefined;
    domFromPos(pos: number, side: number): {
        node: DOMNode;
        offset: number;
        atom?: number;
    };
    parseRange(from: number, to: number, base?: number): {
        node: DOMNode;
        from: number;
        to: number;
        fromOffset: number;
        toOffset: number;
    };
    emptyChildAt(side: number): boolean;
    domAfterPos(pos: number): DOMNode;
    setSelection(anchor: number, head: number, root: Document | ShadowRoot, force?: boolean): void;
    ignoreMutation(mutation: MutationRecord): boolean;
    get contentLost(): boolean | null;
    markDirty(from: number, to: number): void;
    markParentsDirty(): void;
    get domAtom(): boolean;
    get ignoreForCoords(): boolean;
}
export declare class WidgetViewDesc extends ViewDesc {
    readonly widget: Decoration;
    constructor(parent: ViewDesc | undefined, widget: Decoration, dom: DOMNode);
    matchesWidget(widget: Decoration): any;
    parseRule(): {
        ignore: boolean;
    };
    stopEvent(event: Event): any;
    ignoreMutation(mutation: MutationRecord): any;
    get domAtom(): boolean;
    get side(): number;
}
export declare class CompositionViewDesc extends ViewDesc {
    textDOM: Text;
    text: string;
    constructor(parent: ViewDesc | undefined, dom: DOMNode, textDOM: Text, text: string);
    get size(): number;
    localPosFromDOM(dom: DOMNode, offset: number): number;
    domFromPos(pos: number): {
        node: Text;
        offset: number;
    };
    ignoreMutation(mut: MutationRecord): boolean;
}
export declare class MarkViewDesc extends ViewDesc {
    readonly mark: Mark;
    constructor(parent: ViewDesc | undefined, children: ViewDesc[], mark: Mark, dom: DOMNode, contentDOM: HTMLElement);
    parseRule(): ParseRule | null;
    matchesMark(mark: Mark): boolean;
    markDirty(from: number, to: number): void;
}
export declare class NodeViewDesc extends ViewDesc {
    node: Node;
    outerDeco: readonly Decoration[];
    innerDeco: DecorationSource;
    nodeDOM: DOMNode;
    constructor(parent: ViewDesc | undefined, children: ViewDesc[], node: Node, outerDeco: readonly Decoration[], innerDeco: DecorationSource, dom: DOMNode, contentDOM: HTMLElement | null, nodeDOM: DOMNode);
    updateOuterDeco(): void;
    parseRule(): ParseRule | null;
    matchesNode(node: Node, outerDeco: readonly Decoration[], innerDeco: DecorationSource): boolean;
    get size(): number;
    get border(): 1 | 0;
    update(_node: Node, _outerDeco: readonly Decoration[], _innerDeco: DecorationSource, _view: EditorView): boolean;
    selectNode(): void;
    deselectNode(): void;
    get domAtom(): boolean;
}
export declare class TextViewDesc extends NodeViewDesc {
    constructor(parent: ViewDesc | undefined, children: ViewDesc[], node: Node, outerDeco: readonly Decoration[], innerDeco: DecorationSource, dom: DOMNode, nodeDOM: DOMNode);
    parseRule(): ParseRule;
    update(_node: Node, _outerDeco: readonly Decoration[], _innerDeco: DecorationSource, _view: EditorView): boolean;
    inParent(): boolean;
    domFromPos(pos: number): {
        node: globalThis.Node;
        offset: number;
    };
    localPosFromDOM(dom: DOMNode, offset: number, bias: number): number;
    ignoreMutation(mutation: MutationRecord): boolean;
    markDirty(from: number, to: number): void;
    get domAtom(): boolean;
}
export declare class TrailingHackViewDesc extends ViewDesc {
    parseRule(): {
        ignore: boolean;
    };
    matchesHack(nodeName: string): boolean;
    get domAtom(): boolean;
    get ignoreForCoords(): boolean;
}
