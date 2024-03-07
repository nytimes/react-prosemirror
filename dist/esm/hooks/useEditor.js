import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { DecorationSet, EditorView } from "prosemirror-view";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { beforeInputPlugin } from "../plugins/beforeInputPlugin.js";
import { SelectionDOMObserver } from "../selection/SelectionDOMObserver.js";
import { NodeViewDesc } from "../viewdesc.js";
import { useComponentEventListeners } from "./useComponentEventListeners.js";
import { useForceUpdate } from "./useForceUpdate.js";
// @ts-expect-error We're making use of knowledge of internal methods here
export class ReactEditorView extends EditorView {
    /**
   * Like setProps, but without executing any side effects.
   * Safe to use in a component render method.
   */ pureSetProps(props) {
        // this.oldProps = this.props;
        this._props = {
            ...this._props,
            ...props
        };
        this.state = this._props.state;
    }
    /**
   * Triggers any side effects that have been queued by previous
   * calls to pureSetProps.
   */ runPendingEffects() {
        const newProps = this.props;
        this._props = this.oldProps;
        this.state = this._props.state;
        this.update(newProps);
    }
    update(props) {
        super.update(props);
        // Ensure that side effects aren't re-triggered until
        // pureSetProps is called again
        this.oldProps = props;
    }
    updatePluginViews() {
        if (this.shouldUpdatePluginViews) {
            // @ts-expect-error We're making use of knowledge of internal methods here
            super.updatePluginViews();
        }
    }
    constructor(place, props){
        // Call the superclass constructor with an empty
        // document and limited props. We'll set everything
        // else ourselves.
        super(place, {
            state: EditorState.create({
                schema: props.state.schema,
                plugins: props.state.plugins
            }),
            plugins: props.plugins
        });
        this.shouldUpdatePluginViews = false;
        this.shouldUpdatePluginViews = true;
        this._props = props;
        this.oldProps = {
            state: props.state
        };
        this.state = props.state;
        // @ts-expect-error We're making use of knowledge of internal attributes here
        this.domObserver.stop();
        // @ts-expect-error We're making use of knowledge of internal attributes here
        this.domObserver = new SelectionDOMObserver(this);
        // @ts-expect-error We're making use of knowledge of internal attributes here
        this.domObserver.start();
        // updateCursorWrapper(this);
        // Destroy the DOM created by the default
        // ProseMirror ViewDesc implementation; we
        // have a NodeViewDesc from React instead.
        // @ts-expect-error We're making use of knowledge of internal attributes here
        this.docView.dom.replaceChildren();
        // @ts-expect-error We're making use of knowledge of internal attributes here
        this.docView = props.docView;
    }
}
const EMPTY_SCHEMA = new Schema({
    nodes: {
        doc: {
            content: "text*"
        },
        text: {
            inline: true
        }
    }
});
const EMPTY_STATE = EditorState.create({
    schema: EMPTY_SCHEMA
});
let didWarnValueDefaultValue = false;
/**
 * Creates, mounts, and manages a ProseMirror `EditorView`.
 *
 * All state and props updates are executed in a layout effect.
 * To ensure that the EditorState and EditorView are never out of
 * sync, it's important that the EditorView produced by this hook
 * is only accessed through the `useEditorViewEvent` and
 * `useEditorViewLayoutEffect` hooks.
 */ export function useEditor(mount, options) {
    if (process.env.NODE_ENV !== "production") {
        if (options.defaultState !== undefined && options.state !== undefined && !didWarnValueDefaultValue) {
            console.error("A component contains a ProseMirror editor with both value and defaultValue props. " + "ProseMirror editors must be either controlled or uncontrolled " + "(specify either the state prop, or the defaultState prop, but not both). " + "Decide between using a controlled or uncontrolled ProseMirror editor " + "and remove one of these props. More info: " + "https://reactjs.org/link/controlled-components");
            didWarnValueDefaultValue = true;
        }
    }
    const [view, setView] = useState(null);
    const [cursorWrapper, _setCursorWrapper] = useState(null);
    const forceUpdate = useForceUpdate();
    const defaultState = options.defaultState ?? EMPTY_STATE;
    const [_state, setState] = useState(defaultState);
    const state = options.state ?? _state;
    const { componentEventListenersPlugin , registerEventListener , unregisterEventListener  } = useComponentEventListeners();
    const setCursorWrapper = useCallback((deco)=>{
        flushSync(()=>{
            _setCursorWrapper(deco);
        });
    }, []);
    const plugins = useMemo(()=>[
            ...options.plugins ?? [],
            componentEventListenersPlugin,
            beforeInputPlugin(setCursorWrapper)
        ], [
        options.plugins,
        componentEventListenersPlugin,
        setCursorWrapper
    ]);
    function dispatchTransaction(tr) {
        flushSync(()=>{
            if (!options.state) {
                setState((s)=>s.apply(tr));
            }
            if (options.dispatchTransaction) {
                options.dispatchTransaction.call(this, tr);
            }
        });
    }
    const tempDom = document.createElement("div");
    const docViewDescRef = useRef(new NodeViewDesc(undefined, [], state.doc, [], DecorationSet.empty, tempDom, null, tempDom));
    const directEditorProps = {
        ...options,
        state,
        plugins,
        dispatchTransaction,
        docView: docViewDescRef.current
    };
    // This rule is concerned about infinite updates due to the
    // call to setView. These calls are deliberately conditional,
    // so this is not a concern.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useLayoutEffect(()=>{
        if (view && view.dom !== mount) {
            setView(null);
        }
        if (!mount) {
            return;
        }
        if (!view) {
            const newView = new ReactEditorView({
                mount
            }, directEditorProps);
            setView(newView);
            newView.dom.addEventListener("compositionend", forceUpdate);
            return;
        }
    });
    view?.pureSetProps(directEditorProps);
    return useMemo(()=>({
            view: view,
            state: state,
            registerEventListener,
            unregisterEventListener,
            cursorWrapper,
            docViewDescRef
        }), [
        view,
        state,
        registerEventListener,
        unregisterEventListener,
        cursorWrapper
    ]);
}
