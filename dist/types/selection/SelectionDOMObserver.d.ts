import { EditorView } from "prosemirror-view";
import { DOMSelectionRange } from "../dom.js";
declare class SelectionState {
    anchorNode: Node | null;
    anchorOffset: number;
    focusNode: Node | null;
    focusOffset: number;
    set(sel: DOMSelectionRange): void;
    clear(): void;
    eq(sel: DOMSelectionRange): boolean;
}
export declare class SelectionDOMObserver {
    readonly view: EditorView;
    flushingSoon: number;
    currentSelection: SelectionState;
    suppressingSelectionUpdates: boolean;
    constructor(view: EditorView);
    connectSelection(): void;
    disconnectSelection(): void;
    stop(): void;
    start(): void;
    suppressSelectionUpdates(): void;
    setCurSelection(): void;
    ignoreSelectionChange(sel: DOMSelectionRange): true | undefined;
    registerMutation(): void;
    flushSoon(): void;
    updateSelection(): void;
    selectionToDOM(): void;
    flush(): void;
    selectionChanged(sel: DOMSelectionRange): boolean;
    forceFlush(): void;
    onSelectionChange(): void;
}
export {};
