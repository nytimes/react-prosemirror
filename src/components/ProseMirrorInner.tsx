import React, { useMemo } from "react";
import type { ReactNode } from "react";

import { EditorProvider } from "../contexts/EditorContext.js";
import { useComponentEventListeners } from "../hooks/useComponentEventListeners.js";
import { EditorProps, useEditorView } from "../hooks/useEditorView.js";
import { react } from "../plugins/react.js";

export type ProseMirrorProps = EditorProps & {
  mount: HTMLElement | null;
  children?: ReactNode | null;
};

/**
 * Renders the ProseMirror View onto a DOM mount.
 *
 * The `mount` prop must be an actual HTMLElement instance. The
 * JSX element representing the mount should be passed as a child
 * to the ProseMirror component.
 *
 * e.g.
 *
 * ```
 * function MyProseMirrorField() {
 *   const [mount, setMount] = useState(null);
 *
 *   return (
 *     <ProseMirror mount={mount}>
 *       <div ref={setMount} />
 *     </ProseMirror>
 *   );
 * }
 * ```
 */
export function ProseMirrorInner({
  children,
  dispatchTransaction,
  mount,
  ...editorProps
}: ProseMirrorProps) {
  const {
    componentEventListenersPlugin,
    registerEventListener,
    unregisterEventListener,
  } = useComponentEventListeners();

  const plugins = useMemo(
    () => [...(editorProps.plugins ?? []), componentEventListenersPlugin, react()],
    [editorProps.plugins, componentEventListenersPlugin]
  );

  const editorView = useEditorView(mount, {
    ...editorProps,
    plugins,
    dispatchTransaction,
  });

  const editorState =
    "state" in editorProps ? editorProps.state : editorView?.state ?? null;

  const editorContextValue = useMemo(
    () => ({
      editorView,
      editorState,
      registerEventListener,
      unregisterEventListener,
    }),
    [editorState, editorView, registerEventListener, unregisterEventListener]
  );

  return (
    <EditorProvider value={editorContextValue}>
      {children ?? null}
    </EditorProvider>
  );
}
