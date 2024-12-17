import { useContext } from "react";
import { StopEventContext } from "../contexts/StopEventContext.js";
import { useEditorEffect } from "./useEditorEffect.js";
import { useEditorEventCallback } from "./useEditorEventCallback.js";
export function useStopEvent(stopEvent) {
    const register = useContext(StopEventContext);
    const stopEventMemo = useEditorEventCallback(stopEvent);
    useEditorEffect(()=>{
        register(stopEventMemo);
    }, [
        register,
        stopEventMemo
    ]);
}
