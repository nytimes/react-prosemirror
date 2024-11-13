import type { DOMEventMap, EditorView } from "prosemirror-view";
import type { EventHandler } from "../plugins/componentEventListeners";
export interface EditorContextValue {
    view: EditorView | null;
    registerEventListener<EventType extends keyof DOMEventMap>(eventType: EventType, handler: EventHandler<EventType>): void;
    unregisterEventListener<EventType extends keyof DOMEventMap>(eventType: EventType, handler: EventHandler<EventType>): void;
}
/**
 * Provides the EditorView, as well as the current
 * EditorState. Should not be consumed directly; instead
 * see `useEditorState`, `useEditorViewEvent`, and
 * `useEditorViewLayoutEffect`.
 */
export declare const EditorContext: import("react").Context<EditorContextValue>;
