import { render, screen } from "@testing-library/react";
import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import React, { createContext, useContext, useState } from "react";
import { ProseMirror } from "../../components/ProseMirror.js";
import { react } from "../../plugins/react.js";
import { useNodeViews } from "../useNodeViews.js";
const schema = new Schema({
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
const editorState = EditorState.create({
    doc: schema.topNodeType.create(null, schema.nodes.list.createAndFill()),
    schema,
    plugins: [
        react()
    ]
});
describe("useNodeViews", ()=>{
    it("should render node views", ()=>{
        function List(param) {
            let { children  } = param;
            return /*#__PURE__*/ React.createElement(React.Fragment, null, /*#__PURE__*/ React.createElement("span", {
                contentEditable: false
            }, "list"), /*#__PURE__*/ React.createElement("ul", null, children));
        }
        function ListItem(param) {
            let { children  } = param;
            return /*#__PURE__*/ React.createElement(React.Fragment, null, /*#__PURE__*/ React.createElement("span", {
                contentEditable: false
            }, "list item"), /*#__PURE__*/ React.createElement("li", null, children));
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
            const { nodeViews , renderNodeViews  } = useNodeViews(reactNodeViews);
            const [mount, setMount] = useState(null);
            return /*#__PURE__*/ React.createElement(ProseMirror, {
                mount: mount,
                state: editorState,
                nodeViews: nodeViews
            }, /*#__PURE__*/ React.createElement("div", {
                ref: setMount
            }), renderNodeViews());
        }
        render(/*#__PURE__*/ React.createElement(TestEditor, null));
        expect(screen.getByText("list")).toBeTruthy();
        expect(screen.getByText("list item")).toBeTruthy();
    });
    it("should render child node views as children of their parents", ()=>{
        const TestContext = /*#__PURE__*/ createContext("default");
        function List(param) {
            let { children  } = param;
            return /*#__PURE__*/ React.createElement(TestContext.Provider, {
                value: "overriden"
            }, /*#__PURE__*/ React.createElement("ul", null, children));
        }
        function ListItem(param) {
            let { children  } = param;
            const testContextValue = useContext(TestContext);
            return /*#__PURE__*/ React.createElement(React.Fragment, null, /*#__PURE__*/ React.createElement("span", {
                contentEditable: false
            }, testContextValue), /*#__PURE__*/ React.createElement("li", null, children));
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
            const { nodeViews , renderNodeViews  } = useNodeViews(reactNodeViews);
            const [mount, setMount] = useState(null);
            return /*#__PURE__*/ React.createElement(ProseMirror, {
                mount: mount,
                state: editorState,
                nodeViews: nodeViews
            }, /*#__PURE__*/ React.createElement("div", {
                ref: setMount
            }), renderNodeViews());
        }
        render(/*#__PURE__*/ React.createElement(TestEditor, null));
        expect(screen.getByText("overriden")).toBeTruthy();
    });
});
