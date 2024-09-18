import type { DOMEventMap } from "prosemirror-view";
import type { EventHandler } from "../plugins/componentEventListeners.js";
/**
 * Attaches an event listener at the `EditorView`'s DOM node. See
 * [the ProseMirror docs](https://prosemirror.net/docs/ref/#view.EditorProps.handleDOMEvents)
 * for more details.
 */
export declare function useEditorEventListener<EventType extends keyof DOMEventMap>(eventType: EventType, handler: EventHandler<EventType>): void;
