"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useLayoutGroupEffect", {
    enumerable: true,
    get: ()=>useLayoutGroupEffect
});
const _react = require("react");
const _layoutGroupContextJs = require("../contexts/LayoutGroupContext.js");
function useLayoutGroupEffect(effect, deps) {
    const register = (0, _react.useContext)(_layoutGroupContextJs.LayoutGroupContext);
    // The rule for hooks wants to statically verify the deps,
    // but the dependencies are up to the caller, not this implementation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    (0, _react.useLayoutEffect)(()=>register(effect), deps);
}
