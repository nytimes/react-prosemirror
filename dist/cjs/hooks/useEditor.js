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
    ReactEditorView: ()=>ReactEditorView,
    useEditor: ()=>useEditor
});
const _prosemirrorModel = require("prosemirror-model");
const _prosemirrorState = require("prosemirror-state");
const _prosemirrorView = require("prosemirror-view");
const _react = require("react");
const _reactDom = require("react-dom");
const _beforeInputPluginJs = require("../plugins/beforeInputPlugin.js");
const _selectionDOMObserverJs = require("../selection/SelectionDOMObserver.js");
const _viewdescJs = require("../viewdesc.js");
const _useComponentEventListenersJs = require("./useComponentEventListeners.js");
const _useForceUpdateJs = require("./useForceUpdate.js");
let ReactEditorView = class ReactEditorView extends _prosemirrorView.EditorView {
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
            state: _prosemirrorState.EditorState.create({
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
        this.domObserver = new _selectionDOMObserverJs.SelectionDOMObserver(this);
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
};
const EMPTY_SCHEMA = new _prosemirrorModel.Schema({
    nodes: {
        doc: {
            content: "text*"
        },
        text: {
            inline: true
        }
    }
});
const EMPTY_STATE = _prosemirrorState.EditorState.create({
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
    const [view, setView] = (0, _react.useState)(null);
    const [cursorWrapper, _setCursorWrapper] = (0, _react.useState)(null);
    const forceUpdate = (0, _useForceUpdateJs.useForceUpdate)();
    const defaultState = options.defaultState ?? EMPTY_STATE;
    const [_state, setState] = (0, _react.useState)(defaultState);
    const state = options.state ?? _state;
    const { componentEventListenersPlugin , registerEventListener , unregisterEventListener  } = (0, _useComponentEventListenersJs.useComponentEventListeners)();
    const setCursorWrapper = (0, _react.useCallback)((deco)=>{
        (0, _reactDom.flushSync)(()=>{
            _setCursorWrapper(deco);
        });
    }, []);
    const plugins = (0, _react.useMemo)(()=>[
            ...options.plugins ?? [],
            componentEventListenersPlugin,
            (0, _beforeInputPluginJs.beforeInputPlugin)(setCursorWrapper)
        ], [
        options.plugins,
        componentEventListenersPlugin,
        setCursorWrapper
    ]);
    function dispatchTransaction(tr) {
        (0, _reactDom.flushSync)(()=>{
            if (!options.state) {
                setState((s)=>s.apply(tr));
            }
            if (options.dispatchTransaction) {
                options.dispatchTransaction.call(this, tr);
            }
        });
    }
    const tempDom = document.createElement("div");
    const docViewDescRef = (0, _react.useRef)(new _viewdescJs.NodeViewDesc(undefined, [], state.doc, [], _prosemirrorView.DecorationSet.empty, tempDom, null, tempDom));
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
    (0, _react.useLayoutEffect)(()=>{
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
    return (0, _react.useMemo)(()=>({
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
