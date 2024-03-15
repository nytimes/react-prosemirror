import type { EditorView } from "prosemirror-view";
import type { DependencyList } from "react";
/**
 * Registers a layout effect to run after the EditorView has
 * been updated with the latest EditorState and Decorations.
 *
 * Effects can take an EditorView instance as an argument.
 * This hook should be used to execute layout effects that
 * depend on the EditorView, such as for positioning DOM
 * nodes based on ProseMirror positions.
 *
 * Layout effects registered with this hook still fire
 * synchronously after all DOM mutations, but they do so
 * _after_ the EditorView has been updated, even when the
 * EditorView lives in an ancestor component.
 */
export declare function useEditorEffect(effect: (editorView: EditorView) => void | (() => void), dependencies?: DependencyList): void;
