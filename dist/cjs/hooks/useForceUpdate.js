"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useForceUpdate", {
    enumerable: true,
    get: ()=>useForceUpdate
});
const _react = require("react");
function useForceUpdate() {
    const [, forceUpdate] = (0, _react.useReducer)((x)=>x + 1, 0);
    return forceUpdate;
}
