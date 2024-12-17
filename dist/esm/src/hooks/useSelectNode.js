import { useContext } from "react";
import { SelectNodeContext } from "../contexts/SelectNodeContext.js";
import { useEditorEffect } from "./useEditorEffect.js";
import { useEditorEventCallback } from "./useEditorEventCallback.js";
export function useSelectNode(selectNode, deselectNode) {
    const register = useContext(SelectNodeContext);
    const selectNodeMemo = useEditorEventCallback(selectNode);
    const deselectNodeMemo = useEditorEventCallback(deselectNode ?? (()=>{
    // empty
    }));
    return useEditorEffect(()=>{
        register(selectNodeMemo, deselectNodeMemo);
    }, [
        deselectNodeMemo,
        register,
        selectNodeMemo
    ]);
}
