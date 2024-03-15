import type { DOMEventMap } from "prosemirror-view";
import { EventHandler } from "../plugins/componentEventListeners.js";
/**
 * Produces a plugin that can be used with ProseMirror to handle DOM
 * events at the EditorView.dom element.
 *
 * - `reactEventsPlugin` is a ProseMirror plugin for handling DOM events
 * at the EditorView.dom element. It should be passed to `useEditorView`,
 * along with any other plugins.
 *
 * - `registerEventListener` and `unregisterEventListener` should be
 * passed to `EditorContext.Provider`.
 *
 * @privateRemarks
 *
 * This hook uses a combination of mutable and immutable updates to give
 * us precise control over when we re-create the ProseMirror plugin.
 *
 * The plugin has a mutable reference to the set of handlers for each
 * event type, but the set of event types is static. This means that we
 * need to produce a new ProseMirror plugin whenever a new event type is
 * registered. We avoid producing a new ProseMirrer plugin in any other
 * scenario to avoid the performance overhead of reconfiguring the plugins
 * in the EditorView.
 *
 * To accomplish this, we shallowly clone the registry whenever a new event
 * type is registered.
 */
export declare function useComponentEventListeners(): {
    registerEventListener: (eventType: keyof DOMEventMap, handler: EventHandler) => void;
    unregisterEventListener: (eventType: keyof DOMEventMap, handler: EventHandler) => void;
    componentEventListenersPlugin: import("prosemirror-state").Plugin<any>;
};
