"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useClientOnly", {
    enumerable: true,
    get: ()=>useClientOnly
});
const _react = require("react");
function useClientOnly() {
    const [render, setRender] = (0, _react.useState)(false);
    (0, _react.useEffect)(()=>{
        setRender(true);
    }, []);
    return render;
}
