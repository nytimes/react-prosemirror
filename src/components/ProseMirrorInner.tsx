import type { DirectEditorProps } from "prosemirror-view";
import React, { useMemo } from "react";
import type { ReactNode } from "react";

import { EditorContext } from "../contexts/EditorContext.js";
import {
  ProseMirrorEventRegistryContext,
  useProseMirrorEventRegistry,
} from "../contexts/ProseMirrorEventRegistryContext.js";
import { useEditorView } from "../hooks/useEditorView.js";
import { reactEvents } from "../plugins/reactEventPlugin.js";

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
  const { registry, register, unregister } = useProseMirrorEventRegistry();
  const reactEventPlugin = useMemo(() => reactEvents(registry), [registry]);
  const plugins = useMemo(
    () => [...(editorProps.plugins ?? []), reactEventPlugin],
    [editorProps.plugins, reactEventPlugin]
  );

  const editorView = useEditorView(mount, {
    ...editorProps,
    plugins,
    state,
    dispatchTransaction,
  });

  return (
    <ProseMirrorEventRegistryContext.Provider value={{ register, unregister }}>
      <EditorContext.Provider value={{ editorView, editorState: state }}>
        {children ?? null}
      </EditorContext.Provider>
    </ProseMirrorEventRegistryContext.Provider>
  );
}
