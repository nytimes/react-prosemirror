"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ChildDescriptorsContext", {
    enumerable: true,
    get: function() {
        return ChildDescriptorsContext;
    }
});
const _react = require("react");
const ChildDescriptorsContext = (0, _react.createContext)({
    parentRef: {
        current: undefined
    },
    siblingsRef: {
        current: []
    }
});
