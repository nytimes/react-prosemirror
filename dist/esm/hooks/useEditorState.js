import { useContext } from "react";
import { EditorContext } from "../contexts/EditorContext.js";
/**
 * Provides access to the current EditorState value.
 */ export function useEditorState() {
    const { state: editorState  } = useContext(EditorContext);
    return editorState;
}
