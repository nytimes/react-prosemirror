"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "LayoutGroup", {
    enumerable: true,
    get: ()=>LayoutGroup
});
const _react = /*#__PURE__*/ _interopRequireWildcard(require("react"));
const _layoutGroupContextJs = require("../contexts/LayoutGroupContext.js");
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
function LayoutGroup(param) {
    let { children  } = param;
    const createQueue = (0, _react.useRef)(new Set()).current;
    const destroyQueue = (0, _react.useRef)(new Set()).current;
    const isMounted = (0, _react.useRef)(false);
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
                if (isMounted.current) {
                    destroyQueue.add(destroy);
                    ensureFlush();
                } else {
                    destroy();
                }
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
    (0, _react.useLayoutEffect)(()=>{
        isMounted.current = true;
        return ()=>{
            isMounted.current = false;
        };
    }, []);
    return /*#__PURE__*/ _react.default.createElement(_layoutGroupContextJs.LayoutGroupContext.Provider, {
        value: register
    }, children);
}
