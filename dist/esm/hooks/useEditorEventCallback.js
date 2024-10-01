import { useCallback, useContext, useRef } from "react";
import { EditorContext } from "../contexts/EditorContext.js";
import { useEditorEffect } from "./useEditorEffect.js";
/**
 * Returns a stable function reference to be used as an
 * event handler callback.
 *
 * The callback will be called with the EditorView instance
 * as its first argument.
 *
 * This hook is dependent on both the
 * `EditorViewContext.Provider` and the
 * `DeferredLayoutEffectProvider`. It can only be used in a
 * component that is mounted as a child of both of these
 * providers.
 */ export function useEditorEventCallback(callback) {
    const ref = useRef(callback);
    const { view  } = useContext(EditorContext);
    useEditorEffect(()=>{
        ref.current = callback;
    }, [
        callback
    ]);
    return useCallback(function() {
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        if (view) {
            return ref.current(view, ...args);
        }
        return;
    }, [
        view
    ]);
}
