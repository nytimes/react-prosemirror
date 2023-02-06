import type { EditorView } from "prosemirror-view";
import { useCallback, useContext, useRef } from "react";

import { EditorViewContext } from "../contexts/EditorViewContext.js";

import { useEditorViewLayoutEffect } from "./useEditorViewLayoutEffect.js";

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
export function useEditorViewEvent<T extends unknown[]>(
  callback: (view: EditorView | null, ...args: T) => void
) {
  const ref = useRef(callback);
  const { editorView } = useContext(EditorViewContext);

  useEditorViewLayoutEffect(() => {
    ref.current = callback;
  }, [callback]);

  return useCallback(
    (...args: T) => ref.current(editorView, ...args),
    [editorView]
  );
}
