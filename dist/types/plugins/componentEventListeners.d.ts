import { Plugin } from "prosemirror-state";
import { DOMEventMap, EditorView } from "prosemirror-view";
export type EventHandler<EventType extends keyof DOMEventMap = keyof DOMEventMap> = (this: Plugin, view: EditorView, event: DOMEventMap[EventType]) => boolean | void;
export declare function componentEventListeners(eventHandlerRegistry: Map<keyof DOMEventMap, Iterable<EventHandler>>): Plugin<any>;
