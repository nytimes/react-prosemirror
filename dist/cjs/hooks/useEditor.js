"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    ReactEditorView: function() {
        return ReactEditorView;
    },
    useEditor: function() {
        return useEditor;
    }
});
const _prosemirrormodel = require("prosemirror-model");
const _prosemirrorstate = require("prosemirror-state");
const _prosemirrorview = require("prosemirror-view");
const _react = require("react");
const _reactdom = require("react-dom");
const _beforeInputPlugin = require("../plugins/beforeInputPlugin.js");
const _SelectionDOMObserver = require("../selection/SelectionDOMObserver.js");
const _viewdesc = require("../viewdesc.js");
const _useComponentEventListeners = require("./useComponentEventListeners.js");
const _useForceUpdate = require("./useForceUpdate.js");
function buildNodeViews(view) {
    const result = Object.create(null);
    function add(obj) {
        for(const prop in obj)if (!Object.prototype.hasOwnProperty.call(result, prop)) // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        result[prop] = obj[prop];
    }
    view.someProp("nodeViews", add);
    view.someProp("markViews", add);
    return result;
}
function changedNodeViews(a, b) {
    let nA = 0, nB = 0;
    for(const prop in a){
        if (a[prop] != b[prop]) return true;
        nA++;
    }
    for(const _ in b)nB++;
    return nA != nB;
}
function changedProps(a, b) {
    for (const prop of Object.keys(a)){
        if (a[prop] !== b[prop]) return true;
    }
    return false;
}
function getEditable(view) {
    return !view.someProp("editable", (value)=>value(view.state) === false);
}
let ReactEditorView = class ReactEditorView extends _prosemirrorview.EditorView {
    shouldUpdatePluginViews = false;
    oldProps;
    _props;
    constructor(place, props){
        // Call the superclass constructor with an empty
        // document and limited props. We'll set everything
        // else ourselves.
        const prevWindow = globalThis.window;
        // @ts-expect-error HACK - EditorView checks for window.MutationObserver
        // in its constructor, which breaks SSR. We temporarily set window
        // to an empty object to prevent an error from being thrown, and then
        // clean it up so that other isomorphic code doesn't get confused about
        // whether there's a functioning global window object
        globalThis.window ??= {};
        super(place, {
            state: _prosemirrorstate.EditorState.create({
                schema: props.state.schema,
                plugins: props.state.plugins
            }),
            plugins: props.plugins
        });
        globalThis.window = prevWindow;
        this.shouldUpdatePluginViews = true;
        this._props = props;
        this.oldProps = {
            state: props.state
        };
        this.state = props.state;
        // @ts-expect-error We're making use of knowledge of internal attributes here
        this.domObserver.stop();
        // @ts-expect-error We're making use of knowledge of internal attributes here
        this.domObserver = new _SelectionDOMObserver.SelectionDOMObserver(this);
        // @ts-expect-error We're making use of knowledge of internal attributes here
        this.domObserver.start();
        this.editable = getEditable(this);
        // Destroy the DOM created by the default
        // ProseMirror ViewDesc implementation; we
        // have a NodeViewDesc from React instead.
        // @ts-expect-error We're making use of knowledge of internal attributes here
        this.docView.dom.replaceChildren();
        // @ts-expect-error We're making use of knowledge of internal attributes here
        this.docView = props.docView;
    }
    /**
   * Whether the EditorView's updateStateInner method thinks that the
   * docView needs to be blown away and redrawn.
   *
   * @privateremarks
   *
   * When ProseMirror View detects that the EditorState has been reconfigured
   * to provide new custom node views, it calls an internal function that
   * we can't override in order to recreate the entire editor DOM.
   *
   * This property mimics that check, so that we can replace the EditorView
   * with another of our own, preventing ProseMirror View from taking over
   * DOM management responsibility.
   */ get needsRedraw() {
        if (this.oldProps.state.plugins === this._props.state.plugins && this._props.plugins === this.oldProps.plugins) {
            return false;
        }
        const newNodeViews = buildNodeViews(this);
        // @ts-expect-error Internal property
        return changedNodeViews(this.nodeViews, newNodeViews);
    }
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
        this.editable = getEditable(this);
    }
    /**
   * Triggers any side effects that have been queued by previous
   * calls to pureSetProps.
   */ runPendingEffects() {
        if (changedProps(this.props, this.oldProps)) {
            const newProps = this.props;
            this._props = this.oldProps;
            this.state = this._props.state;
            this.update(newProps);
        }
    }
    update(props) {
        super.update(props);
        // Ensure that side effects aren't re-triggered until
        // pureSetProps is called again
        this.oldProps = props;
    }
    updatePluginViews(prevState) {
        if (this.shouldUpdatePluginViews) {
            // @ts-expect-error We're making use of knowledge of internal methods here
            super.updatePluginViews(prevState);
        }
    }
    // We want to trigger the default EditorView cleanup, but without
    // the actual view.dom cleanup (which React will have already handled).
    // So we give the EditorView a dummy DOM element and ask it to clean up
    destroy() {
        // @ts-expect-error we're intentionally overwriting this property
        // to prevent side effects
        this.dom = document.createElement("div");
        super.destroy();
    }
};
const EMPTY_SCHEMA = new _prosemirrormodel.Schema({
    nodes: {
        doc: {
            content: "text*"
        },
        text: {
            inline: true
        }
    }
});
const EMPTY_STATE = _prosemirrorstate.EditorState.create({
    schema: EMPTY_SCHEMA
});
let didWarnValueDefaultValue = false;
function useEditor(mount, options) {
    if (process.env.NODE_ENV !== "production") {
        if (options.defaultState !== undefined && options.state !== undefined && !didWarnValueDefaultValue) {
            console.error("A component contains a ProseMirror editor with both value and defaultValue props. " + "ProseMirror editors must be either controlled or uncontrolled " + "(specify either the state prop, or the defaultState prop, but not both). " + "Decide between using a controlled or uncontrolled ProseMirror editor " + "and remove one of these props. More info: " + "https://reactjs.org/link/controlled-components");
            didWarnValueDefaultValue = true;
        }
    }
    const [cursorWrapper, _setCursorWrapper] = (0, _react.useState)(null);
    const forceUpdate = (0, _useForceUpdate.useForceUpdate)();
    const defaultState = options.defaultState ?? EMPTY_STATE;
    const [_state, setState] = (0, _react.useState)(defaultState);
    const state = options.state ?? _state;
    const { componentEventListenersPlugin, registerEventListener, unregisterEventListener } = (0, _useComponentEventListeners.useComponentEventListeners)();
    const setCursorWrapper = (0, _react.useCallback)((deco)=>{
        (0, _reactdom.flushSync)(()=>{
            _setCursorWrapper(deco);
        });
    }, []);
    const plugins = (0, _react.useMemo)(()=>[
            ...options.plugins ?? [],
            componentEventListenersPlugin,
            (0, _beforeInputPlugin.beforeInputPlugin)(setCursorWrapper)
        ], [
        options.plugins,
        componentEventListenersPlugin,
        setCursorWrapper
    ]);
    const dispatchTransaction = (0, _react.useCallback)(function dispatchTransaction(tr) {
        (0, _reactdom.flushSync)(()=>{
            if (!options.state) {
                setState((s)=>s.apply(tr));
            }
            if (options.dispatchTransaction) {
                options.dispatchTransaction.call(this, tr);
            }
        });
    }, [
        options.dispatchTransaction,
        options.state
    ]);
    const tempDom = document.createElement("div");
    const docViewDescRef = (0, _react.useRef)(new _viewdesc.NodeViewDesc(undefined, [], ()=>-1, state.doc, [], _prosemirrorview.DecorationSet.empty, tempDom, null, tempDom, ()=>false, ()=>{
    /* The doc node can't have a node selection*/ }, ()=>{
    /* The doc node can't have a node selection*/ }));
    const directEditorProps = {
        ...options,
        state,
        plugins,
        dispatchTransaction,
        docView: docViewDescRef.current
    };
    const [view, setView] = (0, _react.useState)(// During the initial render, we create something of a dummy
    // EditorView. This allows us to ensure that the first render actually
    // renders the document, which is necessary for SSR.
    ()=>new ReactEditorView(null, directEditorProps));
    (0, _react.useLayoutEffect)(()=>{
        return ()=>{
            view?.destroy();
        };
    }, [
        view
    ]);
    // This rule is concerned about infinite updates due to the
    // call to setView. These calls are deliberately conditional,
    // so this is not a concern.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    (0, _react.useLayoutEffect)(()=>{
        if (!mount) {
            setView(null);
            return;
        }
        if (!view || view.dom !== mount) {
            const newView = new ReactEditorView({
                mount
            }, directEditorProps);
            setView(newView);
            newView.dom.addEventListener("compositionend", forceUpdate);
            return;
        }
        // TODO: We should be able to put this in previous branch,
        // but we need to convince EditorView's constructor not to
        // clear out the DOM when passed a mount that already has
        // content in it, otherwise React blows up when it tries
        // to clean up.
        if (view.needsRedraw) {
            setView(null);
            return;
        }
        // @ts-expect-error Internal property - domObserver
        view?.domObserver.selectionToDOM();
        view?.runPendingEffects();
    });
    view?.pureSetProps(directEditorProps);
    const editor = (0, _react.useMemo)(()=>({
            view: view,
            registerEventListener,
            unregisterEventListener,
            cursorWrapper,
            docViewDescRef
        }), [
        view,
        registerEventListener,
        unregisterEventListener,
        cursorWrapper
    ]);
    return {
        editor,
        state
    };
}