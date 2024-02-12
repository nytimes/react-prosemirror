import type { Plugin } from "prosemirror-state";
import type { DOMEventMap, EditorView } from "prosemirror-view";
import { useCallback, useContext, useRef } from "react";

import { EditorContext } from "../contexts/EditorContext.js";
import type { EventHandler } from "../plugins/componentEventListeners.js";

import { useEditorEffect } from "./useEditorEffect.js";

/**
 * Attaches an event listener at the `EditorView`'s DOM node. See
 * [the ProseMirror docs](https://prosemirror.net/docs/ref/#view.EditorProps.handleDOMEvents)
 * for more details.
 */
export function useEditorEventListener<EventType extends keyof DOMEventMap>(
  eventType: EventType,
  handler: EventHandler<EventType>
) {
  const { registerEventListener, unregisterEventListener } =
    useContext(EditorContext);

  const ref = useRef(handler);

  useEditorEffect(() => {
    ref.current = handler;
  }, [handler]);

  const eventHandler = useCallback(function (
    this: Plugin,
    view: EditorView,
    event: DOMEventMap[EventType]
  ) {
    return ref.current.call(this, view, event);
  }, []);

  useEditorEffect(() => {
    registerEventListener(eventType, eventHandler);
    return () => unregisterEventListener(eventType, eventHandler);
  }, [eventHandler, eventType, registerEventListener, unregisterEventListener]);
}
