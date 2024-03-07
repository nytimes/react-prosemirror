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
    LayoutGroup: ()=>LayoutGroup,
    useLayoutGroupEffect: ()=>useLayoutGroupEffect
});
const _react = /*#__PURE__*/ _interopRequireWildcard(require("react"));
const _useForceUpdateJs = require("../hooks/useForceUpdate.js");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interopRequireWildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {};
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
/**
 * Like `useLayoutEffect`, but all effect executions are run
 * *after* the `DeferredLayoutEffectsProvider` layout effects
 * phase.
 *
 * This hook allows child components to enqueue layout effects
 * that won't be safe to run until after a parent component's
 * layout effects have run.
 *
 */ const useLayoutGroupEffectsRegistry = ()=>{
    const createQueue = (0, _react.useRef)(new Set()).current;
    const destroyQueue = (0, _react.useRef)(new Set()).current;
    const forceUpdate = (0, _useForceUpdateJs.useForceUpdate)();
    const isUpdatePending = (0, _react.useRef)(true);
    const ensureFlush = (0, _react.useCallback)(()=>{
        if (!isUpdatePending.current) {
            forceUpdate();
            isUpdatePending.current = true;
        }
    }, [
        forceUpdate
    ]);
    const register = (0, _react.useCallback)((effect)=>{
        let destroy;
        const create = ()=>{
            destroy = effect();
        };
        createQueue.add(create);
        ensureFlush();
        return ()=>{
            createQueue.delete(create);
            if (destroy) {
                destroyQueue.add(destroy);
                ensureFlush();
            }
        };
    }, [
        createQueue,
        destroyQueue,
        ensureFlush
    ]);
    (0, _react.useLayoutEffect)(()=>{
        isUpdatePending.current = false;
        createQueue.forEach((create)=>create());
        createQueue.clear();
        return ()=>{
            destroyQueue.forEach((destroy)=>destroy());
            destroyQueue.clear();
        };
    });
    return register;
};
const LayoutGroupContext = /*#__PURE__*/ (0, _react.createContext)(null);
function LayoutGroup(param) {
    let { children  } = param;
    const register = useLayoutGroupEffectsRegistry();
    return /*#__PURE__*/ _react.default.createElement(LayoutGroupContext.Provider, {
        value: register
    }, children);
}
function useLayoutGroupEffect(effect, deps) {
    const register = (0, _react.useContext)(LayoutGroupContext);
    // The rule for hooks wants to statically verify the deps,
    // but the dependencies are up to the caller, not this implementation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    (0, _react.useLayoutEffect)(()=>register(effect), deps);
}
