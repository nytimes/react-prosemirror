import type { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import type { DirectEditorProps } from "prosemirror-view";
type EditorStateProps = {
    state: EditorState;
} | {
    defaultState: EditorState;
};
export type EditorProps = Omit<DirectEditorProps, "state"> & EditorStateProps;
/**
 * Creates, mounts, and manages a ProseMirror `EditorView`.
 *
 * All state and props updates are executed in a layout effect.
 * To ensure that the EditorState and EditorView are never out of
 * sync, it's important that the EditorView produced by this hook
 * is only accessed through the `useEditorViewEvent` and
 * `useEditorViewLayoutEffect` hooks.
 */
export declare function useEditorView<T extends HTMLElement = HTMLElement>(mount: T | null, props: EditorProps): EditorView | null;
export {};
