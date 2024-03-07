import React, { useCallback, useMemo, useState } from "react";
import { PortalRegistryContext } from "../contexts/PortalRegistryContext.js";
import { createReactNodeViewConstructor, findNodeKeyUp } from "../nodeViews/createReactNodeViewConstructor.js";
import { ROOT_NODE_KEY } from "../plugins/react.js";
import { useEditorEffect } from "./useEditorEffect.js";
function NodeViews(param) {
    let { portals  } = param;
    const rootRegisteredPortals = portals[ROOT_NODE_KEY];
    const [rootPortals, setRootPortals] = useState(rootRegisteredPortals?.map((param)=>{
        let { portal  } = param;
        return portal;
    }));
    // `getPos` is technically derived from the EditorView
    // state, so it's not safe to call until after the EditorView
    // has been updated
    useEditorEffect(()=>{
        setRootPortals(rootRegisteredPortals?.sort((a, b)=>a.getPos() - b.getPos()).map((param)=>{
            let { portal  } = param;
            return portal;
        }));
    }, [
        rootRegisteredPortals
    ]);
    return /*#__PURE__*/ React.createElement(PortalRegistryContext.Provider, {
        value: portals
    }, rootPortals);
}
export function useNodeViews(nodeViews) {
    const [portals, setPortals] = useState({});
    const registerPortal = useCallback((view, getPos, portal)=>{
        const nearestAncestorKey = findNodeKeyUp(view, getPos());
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
    const reactNodeViews = useMemo(()=>{
        const nodeViewEntries = Object.entries(nodeViews);
        const reactNodeViewEntries = nodeViewEntries.map((param)=>{
            let [name, constructor] = param;
            return [
                name,
                createReactNodeViewConstructor(constructor, registerPortal)
            ];
        });
        return Object.fromEntries(reactNodeViewEntries);
    }, [
        nodeViews,
        registerPortal
    ]);
    return {
        nodeViews: reactNodeViews,
        renderNodeViews: ()=>/*#__PURE__*/ React.createElement(NodeViews, {
                portals: portals
            })
    };
}
