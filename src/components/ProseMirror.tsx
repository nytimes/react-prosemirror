import type { EditorState, Plugin, Transaction } from "prosemirror-state";
import type { EditorProps, EditorView } from "prosemirror-view";
import React from "react";
import type { ReactNode } from "react";

import { EditorProvider } from "../contexts/EditorContext.js";
import { LayoutGroup } from "../contexts/LayoutGroup.js";
import { useEditorView } from "../hooks/useEditorView.js";

interface Props extends EditorProps {
  mount: HTMLElement | null;
  children?: ReactNode | null;
  defaultState?: EditorState;
  state?: EditorState;
  plugins?: readonly Plugin[];
  dispatchTransaction?(this: EditorView, tr: Transaction): void;
}

function Editor({ mount, children, ...props }: Props) {
  const value = useEditorView(mount, props);
  return <EditorProvider value={value}>{children}</EditorProvider>;
}

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
export function ProseMirror(props: Props) {
  return (
    <LayoutGroup>
      <Editor {...props} />
    </LayoutGroup>
  );
}
