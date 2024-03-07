"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useEditorView", {
    enumerable: true,
    get: ()=>useEditorView
});
const _prosemirrorView = require("prosemirror-view");
const _react = require("react");
const _reactDom = require("react-dom");
const _useForceUpdateJs = require("./useForceUpdate.js");
function withFlushedUpdates(fn) {
    return function() {
        for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
            args[_key] = arguments[_key];
        }
        (0, _reactDom.flushSync)(()=>{
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
function useEditorView(mount, props) {
    const [view, setView] = (0, _react.useState)(null);
    const forceUpdate = (0, _useForceUpdateJs.useForceUpdate)();
    const editorProps = withFlushedDispatch(props, forceUpdate);
    const stateProp = "state" in editorProps ? editorProps.state : undefined;
    const state = "defaultState" in editorProps ? editorProps.defaultState : editorProps.state;
    const nonStateProps = Object.fromEntries(Object.entries(editorProps).filter((param)=>{
        let [propName] = param;
        return propName !== "state" && propName !== "defaultState";
    }));
    (0, _react.useLayoutEffect)(()=>{
        return ()=>{
            if (view) {
                view.destroy();
            }
        };
    }, [
        view
    ]);
    (0, _react.useLayoutEffect)(()=>{
        if (view && view.dom !== mount) {
            setView(null);
            return;
        }
        if (!mount) {
            return;
        }
        if (!view) {
            setView(new _prosemirrorView.EditorView({
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
    (0, _react.useLayoutEffect)(()=>{
        view?.setProps(nonStateProps);
    }, [
        view,
        nonStateProps
    ]);
    (0, _react.useLayoutEffect)(()=>{
        if (stateProp) view?.setProps({
            state: stateProp
        });
    }, [
        view,
        stateProp
    ]);
    return view;
}
