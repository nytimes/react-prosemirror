"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _react = require("@testing-library/react");
const _prosemirrorModel = require("prosemirror-model");
const _prosemirrorState = require("prosemirror-state");
const _react1 = /*#__PURE__*/ _interopRequireWildcard(require("react"));
const _proseMirrorJs = require("../../components/ProseMirror.js");
const _reactJs = require("../../plugins/react.js");
const _useNodeViewsJs = require("../useNodeViews.js");
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
const schema = new _prosemirrorModel.Schema({
    nodes: {
        doc: {
            content: "block+"
        },
        list: {
            group: "block",
            content: "list_item+"
        },
        list_item: {
            content: "inline*"
        },
        text: {
            group: "inline"
        }
    }
});
const editorState = _prosemirrorState.EditorState.create({
    doc: schema.topNodeType.create(null, schema.nodes.list.createAndFill()),
    schema,
    plugins: [
        (0, _reactJs.react)()
    ]
});
describe("useNodeViews", ()=>{
    it("should render node views", ()=>{
        function List(param) {
            let { children  } = param;
            return /*#__PURE__*/ _react1.default.createElement(_react1.default.Fragment, null, /*#__PURE__*/ _react1.default.createElement("span", {
                contentEditable: false
            }, "list"), /*#__PURE__*/ _react1.default.createElement("ul", null, children));
        }
        function ListItem(param) {
            let { children  } = param;
            return /*#__PURE__*/ _react1.default.createElement(_react1.default.Fragment, null, /*#__PURE__*/ _react1.default.createElement("span", {
                contentEditable: false
            }, "list item"), /*#__PURE__*/ _react1.default.createElement("li", null, children));
        }
        const reactNodeViews = {
            list: ()=>({
                    component: List,
                    dom: document.createElement("div"),
                    contentDOM: document.createElement("div")
                }),
            list_item: ()=>({
                    component: ListItem,
                    dom: document.createElement("div"),
                    contentDOM: document.createElement("div")
                })
        };
        function TestEditor() {
            const { nodeViews , renderNodeViews  } = (0, _useNodeViewsJs.useNodeViews)(reactNodeViews);
            const [mount, setMount] = (0, _react1.useState)(null);
            return /*#__PURE__*/ _react1.default.createElement(_proseMirrorJs.ProseMirror, {
                mount: mount,
                state: editorState,
                nodeViews: nodeViews
            }, /*#__PURE__*/ _react1.default.createElement("div", {
                ref: setMount
            }), renderNodeViews());
        }
        (0, _react.render)(/*#__PURE__*/ _react1.default.createElement(TestEditor, null));
        expect(_react.screen.getByText("list")).toBeTruthy();
        expect(_react.screen.getByText("list item")).toBeTruthy();
    });
    it("should render child node views as children of their parents", ()=>{
        const TestContext = /*#__PURE__*/ (0, _react1.createContext)("default");
        function List(param) {
            let { children  } = param;
            return /*#__PURE__*/ _react1.default.createElement(TestContext.Provider, {
                value: "overriden"
            }, /*#__PURE__*/ _react1.default.createElement("ul", null, children));
        }
        function ListItem(param) {
            let { children  } = param;
            const testContextValue = (0, _react1.useContext)(TestContext);
            return /*#__PURE__*/ _react1.default.createElement(_react1.default.Fragment, null, /*#__PURE__*/ _react1.default.createElement("span", {
                contentEditable: false
            }, testContextValue), /*#__PURE__*/ _react1.default.createElement("li", null, children));
        }
        const reactNodeViews = {
            list: ()=>({
                    component: List,
                    dom: document.createElement("div"),
                    contentDOM: document.createElement("div")
                }),
            list_item: ()=>({
                    component: ListItem,
                    dom: document.createElement("div"),
                    contentDOM: document.createElement("div")
                })
        };
        function TestEditor() {
            const { nodeViews , renderNodeViews  } = (0, _useNodeViewsJs.useNodeViews)(reactNodeViews);
            const [mount, setMount] = (0, _react1.useState)(null);
            return /*#__PURE__*/ _react1.default.createElement(_proseMirrorJs.ProseMirror, {
                mount: mount,
                state: editorState,
                nodeViews: nodeViews
            }, /*#__PURE__*/ _react1.default.createElement("div", {
                ref: setMount
            }), renderNodeViews());
        }
        (0, _react.render)(/*#__PURE__*/ _react1.default.createElement(TestEditor, null));
        expect(_react.screen.getByText("overriden")).toBeTruthy();
    });
});
