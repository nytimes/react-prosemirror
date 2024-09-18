import { reactKeysPluginKey } from "../plugins/reactKeys.js";
import { useEditorState } from "./useEditorState.js";
export function useReactKeys() {
    const state = useEditorState();
    return reactKeysPluginKey.getState(state);
}
