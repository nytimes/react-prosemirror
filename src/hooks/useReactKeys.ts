import { reactKeysPluginKey } from "../plugins/reactKeys.js";

import { useReactEditorState } from "./useReactEditorState.js";

export function useReactKeys() {
  const state = useReactEditorState();
  return state && reactKeysPluginKey.getState(state);
}
