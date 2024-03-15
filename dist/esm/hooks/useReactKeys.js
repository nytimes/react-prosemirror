import { reactKeysPluginKey } from "../plugins/reactKeys.js";
import { useEditorState } from "./useEditorState.js";
export function useReactKeys() {
    const state = useEditorState();
    return state && reactKeysPluginKey.getState(state);
}
