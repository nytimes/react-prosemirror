import type { DirectEditorProps } from "prosemirror-view";
import React, { useMemo } from "react";
import type { ReactNode } from "react";

import { EditorProvider } from "../contexts/EditorContext.js";
import { useComponentEventListenersPlugin } from "../hooks/useComponentEventListenersPlugin.js";
import { useEditorView } from "../hooks/useEditorView.js";

export type ProseMirrorProps = DirectEditorProps & {
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
  state,
  mount,
  ...editorProps
}: ProseMirrorProps) {
  const {
    componentEventListenersPlugin,
    registerEventListener,
    unregisterEventListener,
  } = useComponentEventListenersPlugin();

  const plugins = useMemo(
    () => [...(editorProps.plugins ?? []), componentEventListenersPlugin],
    [editorProps.plugins, componentEventListenersPlugin]
  );

  const editorView = useEditorView(mount, {
    ...editorProps,
    plugins,
    state,
    dispatchTransaction,
  });

  const editorContextValue = useMemo(
    () => ({
      editorView,
      editorState: state,
      registerEventListener,
      unregisterEventListener,
    }),
    [editorView, state, registerEventListener, unregisterEventListener]
  );

  return (
    <EditorProvider value={editorContextValue}>
      {children ?? null}
    </EditorProvider>
  );
}
