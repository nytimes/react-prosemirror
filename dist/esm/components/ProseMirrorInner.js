import React, { useMemo } from "react";
import { EditorProvider } from "../contexts/EditorContext.js";
import { useComponentEventListeners } from "../hooks/useComponentEventListeners.js";
import { useEditorView } from "../hooks/useEditorView.js";
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
 */ export function ProseMirrorInner(param) {
    let { children , mount , ...editorProps } = param;
    const { componentEventListenersPlugin , registerEventListener , unregisterEventListener  } = useComponentEventListeners();
    const plugins = useMemo(()=>[
            ...editorProps.plugins ?? [],
            componentEventListenersPlugin
        ], [
        editorProps.plugins,
        componentEventListenersPlugin
    ]);
    const editorView = useEditorView(mount, {
        ...editorProps,
        plugins
    });
    const editorState = "state" in editorProps ? editorProps.state : editorView?.state ?? null;
    const editorContextValue = useMemo(()=>({
            editorView,
            editorState,
            registerEventListener,
            unregisterEventListener
        }), [
        editorState,
        editorView,
        registerEventListener,
        unregisterEventListener
    ]);
    return /*#__PURE__*/ React.createElement(EditorProvider, {
        value: editorContextValue
    }, children ?? null);
}
