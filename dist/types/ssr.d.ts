/**
 * @fileoverview
 *
 * Stubs for ProseMirror View during SSR. These are extremely
 * barebones, because they _do not need to actually work_. They
 * just need to prevent errors from being thrown when ProseMirror
 * View attemps to access these APIs while constructing the
 * initial EditorView. None of these APIs are necessary for SSR to
 * work properly, so it's fine that they're all no-ops.
 */
/**
 * Sets up tiny no-op stubs for the global window and document.
 * These are used to prevent errors from being thrown when ProseMirror's
 * EditorView attempts to access the DOM in its constructor during SSR.
 *
 * Returns a cleanup function that resets the window and document back
 * to their original values (undefined).
 */
export declare function setSsrStubs(): () => void;
