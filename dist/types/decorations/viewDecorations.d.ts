import { Decoration, DecorationSource, EditorView } from "prosemirror-view";
/**
 * Produces the DecorationSource for the current state, based
 * on the decorations editor prop.
 *
 * The return value of this function is memoized; if it is to
 * return an equivalent value to the last time it was called for
 * a given EditorView, it will return exactly that previous value.
 *
 * This makes it safe to call in a React render function, even
 * if its result is used in a dependencies array for a hook.
 */
export declare function viewDecorations(view: EditorView, cursorWrapper: Decoration | null): DecorationSource;
