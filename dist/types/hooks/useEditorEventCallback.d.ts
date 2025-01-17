import type { EditorView } from "prosemirror-view";
/**
 * Returns a stable function reference to be used as an
 * event handler callback.
 *
 * The callback will be called with the EditorView instance
 * as its first argument.
 *
 * This hook is dependent on both the
 * `EditorViewContext.Provider` and the
 * `DeferredLayoutEffectProvider`. It can only be used in a
 * component that is mounted as a child of both of these
 * providers.
 */
export declare function useEditorEventCallback<T extends unknown[], R>(callback: (view: EditorView, ...args: T) => R): (...args: T) => R | undefined;
