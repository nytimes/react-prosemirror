import type { ReactNode } from "react";
import { EditorProps } from "../hooks/useEditorView.js";
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
export declare function ProseMirrorInner({ children, mount, ...editorProps }: ProseMirrorProps): JSX.Element;
