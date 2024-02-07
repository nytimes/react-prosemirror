import React from "react";

import { Editor } from "./Editor.js";
import type { EditorProps } from "./Editor.js";
import { LayoutGroup } from "./LayoutGroup.js";

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
export function ProseMirror(props: EditorProps) {
  return (
    <LayoutGroup>
      <Editor {...props} />
    </LayoutGroup>
  );
}
