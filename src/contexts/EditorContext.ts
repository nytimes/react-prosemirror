import type { EditorState } from "prosemirror-state";
import type { DOMEventMap, EditorView } from "prosemirror-view";
import { createContext } from "react";

import type { EventHandler } from "../plugins/componentEventListeners";

interface EditorContextValue {
  editorView: EditorView | null;
  editorState: EditorState;
  registerEventListener<EventType extends keyof DOMEventMap>(
    eventType: EventType,
    handler: EventHandler<EventType>
  ): void;
  unregisterEventListener<EventType extends keyof DOMEventMap>(
    eventType: EventType,
    handler: EventHandler<EventType>
  ): void;
}

/**
 * Provides the EditorView, as well as the current
 * EditorState. Should not be consumed directly; instead
 * see `useEditorState`, `useEditorViewEvent`, and
 * `useEditorViewLayoutEffect`.
 */
export const EditorContext = createContext(
  null as unknown as EditorContextValue
);

export const EditorProvider = EditorContext.Provider;
