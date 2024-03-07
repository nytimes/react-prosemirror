import { EditorView } from "prosemirror-view";
import { useLayoutEffect, useState } from "react";
import { flushSync } from "react-dom";
import { useForceUpdate } from "./useForceUpdate.js";
function withFlushedUpdates(fn) {
    return function() {
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        flushSync(()=>{
            fn.call(this, ...args);
        });
    };
}
function defaultDispatchTransaction(tr) {
    this.updateState(this.state.apply(tr));
}
function withFlushedDispatch(props, forceUpdate) {
    return {
        ...props,
        ...{
            dispatchTransaction: function dispatchTransaction(tr) {
                const flushedDispatch = withFlushedUpdates(props.dispatchTransaction ?? defaultDispatchTransaction);
                flushedDispatch.call(this, tr);
                if (!("state" in props)) forceUpdate();
            }
        }
    };
}
/**
 * Creates, mounts, and manages a ProseMirror `EditorView`.
 *
 * All state and props updates are executed in a layout effect.
 * To ensure that the EditorState and EditorView are never out of
 * sync, it's important that the EditorView produced by this hook
 * is only accessed through the `useEditorViewEvent` and
 * `useEditorViewLayoutEffect` hooks.
 */ export function useEditorView(mount, props) {
    const [view, setView] = useState(null);
    const forceUpdate = useForceUpdate();
    const editorProps = withFlushedDispatch(props, forceUpdate);
    const stateProp = "state" in editorProps ? editorProps.state : undefined;
    const state = "defaultState" in editorProps ? editorProps.defaultState : editorProps.state;
    const nonStateProps = Object.fromEntries(Object.entries(editorProps).filter((param)=>{
        let [propName] = param;
        return propName !== "state" && propName !== "defaultState";
    }));
    useLayoutEffect(()=>{
        return ()=>{
            if (view) {
                view.destroy();
            }
        };
    }, [
        view
    ]);
    useLayoutEffect(()=>{
        if (view && view.dom !== mount) {
            setView(null);
            return;
        }
        if (!mount) {
            return;
        }
        if (!view) {
            setView(new EditorView({
                mount
            }, {
                ...editorProps,
                state
            }));
            return;
        }
    }, [
        editorProps,
        mount,
        state,
        view
    ]);
    useLayoutEffect(()=>{
        view?.setProps(nonStateProps);
    }, [
        view,
        nonStateProps
    ]);
    useLayoutEffect(()=>{
        if (stateProp) view?.setProps({
            state: stateProp
        });
    }, [
        view,
        stateProp
    ]);
    return view;
}
