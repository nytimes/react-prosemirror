/// <reference types="react" />
import { EditorState, Plugin, Transaction } from "prosemirror-state";
import { Decoration, DirectEditorProps, EditorProps, EditorView } from "prosemirror-view";
import { DOMNode } from "../dom.js";
import { NodeViewDesc } from "../viewdesc.js";
export declare class ReactEditorView extends EditorView {
    private shouldUpdatePluginViews;
    private oldProps;
    private _props;
    constructor(place: null | DOMNode | ((editor: HTMLElement) => void) | {
        mount: HTMLElement;
    }, props: DirectEditorProps & {
        docView: NodeViewDesc;
    });
    /**
     * Like setProps, but without executing any side effects.
     * Safe to use in a component render method.
     */
    pureSetProps(props: Partial<DirectEditorProps>): void;
    /**
     * Triggers any side effects that have been queued by previous
     * calls to pureSetProps.
     */
    runPendingEffects(): void;
    update(props: DirectEditorProps): void;
    updatePluginViews(): void;
}
export interface UseEditorOptions extends EditorProps {
    defaultState?: EditorState;
    state?: EditorState;
    plugins?: Plugin[];
    dispatchTransaction?(this: EditorView, tr: Transaction): void;
}
/**
 * Creates, mounts, and manages a ProseMirror `EditorView`.
 *
 * All state and props updates are executed in a layout effect.
 * To ensure that the EditorState and EditorView are never out of
 * sync, it's important that the EditorView produced by this hook
 * is only accessed through the `useEditorViewEvent` and
 * `useEditorViewLayoutEffect` hooks.
 */
export declare function useEditor<T extends HTMLElement = HTMLElement>(mount: T | null, options: UseEditorOptions): {
    view: EditorView | null;
    state: EditorState;
    registerEventListener: (eventType: keyof import("prosemirror-view").DOMEventMap, handler: import("../plugins/componentEventListeners.js").EventHandler<keyof import("prosemirror-view").DOMEventMap>) => void;
    unregisterEventListener: (eventType: keyof import("prosemirror-view").DOMEventMap, handler: import("../plugins/componentEventListeners.js").EventHandler<keyof import("prosemirror-view").DOMEventMap>) => void;
    cursorWrapper: Decoration | null;
    docViewDescRef: import("react").MutableRefObject<NodeViewDesc>;
};
