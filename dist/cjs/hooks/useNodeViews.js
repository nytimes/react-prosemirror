"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useNodeViews", {
    enumerable: true,
    get: ()=>useNodeViews
});
const _react = /*#__PURE__*/ _interopRequireWildcard(require("react"));
const _portalRegistryContextJs = require("../contexts/PortalRegistryContext.js");
const _createReactNodeViewConstructorJs = require("../nodeViews/createReactNodeViewConstructor.js");
const _reactJs = require("../plugins/react.js");
const _useEditorEffectJs = require("./useEditorEffect.js");
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
function NodeViews(param) {
    let { portals  } = param;
    const rootRegisteredPortals = portals[_reactJs.ROOT_NODE_KEY];
    const [rootPortals, setRootPortals] = (0, _react.useState)(rootRegisteredPortals?.map((param)=>{
        let { portal  } = param;
        return portal;
    }));
    // `getPos` is technically derived from the EditorView
    // state, so it's not safe to call until after the EditorView
    // has been updated
    (0, _useEditorEffectJs.useEditorEffect)(()=>{
        setRootPortals(rootRegisteredPortals?.sort((a, b)=>a.getPos() - b.getPos()).map((param)=>{
            let { portal  } = param;
            return portal;
        }));
    }, [
        rootRegisteredPortals
    ]);
    return /*#__PURE__*/ _react.default.createElement(_portalRegistryContextJs.PortalRegistryContext.Provider, {
        value: portals
    }, rootPortals);
}
function useNodeViews(nodeViews) {
    const [portals, setPortals] = (0, _react.useState)({});
    const registerPortal = (0, _react.useCallback)((view, getPos, portal)=>{
        const nearestAncestorKey = (0, _createReactNodeViewConstructorJs.findNodeKeyUp)(view, getPos());
        setPortals((oldPortals)=>{
            const oldChildPortals = oldPortals[nearestAncestorKey] ?? [];
            const newChildPortals = oldChildPortals.concat({
                getPos,
                portal
            });
            return {
                ...oldPortals,
                [nearestAncestorKey]: newChildPortals
            };
        });
        return ()=>{
            setPortals((oldPortals)=>{
                const oldChildPortals = oldPortals[nearestAncestorKey] ?? [];
                const newChildPortals = oldChildPortals.filter((param)=>{
                    let { portal: p  } = param;
                    return p !== portal;
                });
                return {
                    ...oldPortals,
                    [nearestAncestorKey]: newChildPortals
                };
            });
        };
    }, []);
    const reactNodeViews = (0, _react.useMemo)(()=>{
        const nodeViewEntries = Object.entries(nodeViews);
        const reactNodeViewEntries = nodeViewEntries.map((param)=>{
            let [name, constructor] = param;
            return [
                name,
                (0, _createReactNodeViewConstructorJs.createReactNodeViewConstructor)(constructor, registerPortal)
            ];
        });
        return Object.fromEntries(reactNodeViewEntries);
    }, [
        nodeViews,
        registerPortal
    ]);
    return {
        nodeViews: reactNodeViews,
        renderNodeViews: ()=>/*#__PURE__*/ _react.default.createElement(NodeViews, {
                portals: portals
            })
    };
}
