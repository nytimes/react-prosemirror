/* eslint-disable @typescript-eslint/no-explicit-any */ /* eslint-disable @typescript-eslint/no-non-null-assertion */ function _extends() {
    _extends = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends.apply(this, arguments);
}
import { render, screen } from "@testing-library/react";
import { Schema } from "prosemirror-model";
import { EditorState, Plugin } from "prosemirror-state";
import { doc, em, hr, li, p, schema, strong, ul } from "prosemirror-test-builder";
import React, { forwardRef, useEffect, useState } from "react";
import { useEditorEffect } from "../../hooks/useEditorEffect.js";
import { useStopEvent } from "../../hooks/useStopEvent.js";
import { reactKeys } from "../../plugins/reactKeys.js";
import { tempEditor } from "../../testing/editorViewTestHelpers.js";
import { ProseMirror } from "../ProseMirror.js";
import { ProseMirrorDoc } from "../ProseMirrorDoc.js";
describe("ProseMirror", ()=>{
    it("renders a contenteditable", async ()=>{
        const schema = new Schema({
            nodes: {
                text: {},
                doc: {
                    content: "text*"
                }
            }
        });
        const editorState = EditorState.create({
            schema
        });
        function TestEditor() {
            return /*#__PURE__*/ React.createElement(ProseMirror, {
                defaultState: editorState
            }, /*#__PURE__*/ React.createElement(ProseMirrorDoc, {
                "data-testid": "editor"
            }));
        }
        render(/*#__PURE__*/ React.createElement(TestEditor, null));
        const editor = screen.getByTestId("editor");
        editor.focus();
        await browser.keys("H");
        await browser.keys("e");
        await browser.keys("l");
        await browser.keys("l");
        await browser.keys("o");
        await browser.keys(",");
        await browser.keys(" ");
        await browser.keys("w");
        await browser.keys("o");
        await browser.keys("r");
        await browser.keys("l");
        await browser.keys("d");
        await browser.keys("!");
        expect(editor.textContent).toBe("Hello, world!");
    });
    it("supports lifted editor state", async ()=>{
        const schema = new Schema({
            nodes: {
                text: {},
                doc: {
                    content: "text*"
                }
            }
        });
        let outerEditorState = EditorState.create({
            schema
        });
        function TestEditor() {
            const [editorState, setEditorState] = useState(outerEditorState);
            useEffect(()=>{
                outerEditorState = editorState;
            }, [
                editorState
            ]);
            return /*#__PURE__*/ React.createElement(ProseMirror, {
                state: editorState,
                dispatchTransaction: (tr)=>setEditorState(editorState.apply(tr))
            }, /*#__PURE__*/ React.createElement(ProseMirrorDoc, {
                "data-testid": "editor"
            }));
        }
        render(/*#__PURE__*/ React.createElement(TestEditor, null));
        const editor = screen.getByTestId("editor");
        editor.focus();
        await browser.keys("H");
        await browser.keys("e");
        await browser.keys("l");
        await browser.keys("l");
        await browser.keys("o");
        await browser.keys(",");
        await browser.keys(" ");
        await browser.keys("w");
        await browser.keys("o");
        await browser.keys("r");
        await browser.keys("l");
        await browser.keys("d");
        await browser.keys("!");
        expect(outerEditorState.doc.textContent).toBe("Hello, world!");
    });
    it("supports React NodeViews", async ()=>{
        const schema = new Schema({
            nodes: {
                text: {},
                paragraph: {
                    content: "text*",
                    toDOM () {
                        return [
                            "p",
                            0
                        ];
                    }
                },
                doc: {
                    content: "paragraph+"
                }
            }
        });
        const editorState = EditorState.create({
            schema
        });
        const Paragraph = /*#__PURE__*/ forwardRef(function Paragraph(param, ref) {
            let { children  } = param;
            return /*#__PURE__*/ React.createElement("p", {
                ref: ref,
                "data-testid": "paragraph"
            }, children);
        });
        const reactNodeViews = {
            paragraph: Paragraph
        };
        function TestEditor() {
            return /*#__PURE__*/ React.createElement(ProseMirror, {
                defaultState: editorState,
                nodeViews: reactNodeViews
            }, /*#__PURE__*/ React.createElement(ProseMirrorDoc, {
                "data-testid": "editor"
            }));
        }
        render(/*#__PURE__*/ React.createElement(TestEditor, null));
        const editor = screen.getByTestId("editor");
        editor.focus();
        await browser.keys("H");
        await browser.keys("e");
        await browser.keys("l");
        await browser.keys("l");
        await browser.keys("o");
        await browser.keys(",");
        await browser.keys(" ");
        await browser.keys("w");
        await browser.keys("o");
        await browser.keys("r");
        await browser.keys("l");
        await browser.keys("d");
        await browser.keys("!");
        expect(editor.textContent).toBe("Hello, world!");
        // Ensure that ProseMirror really rendered our Paragraph
        // component, not just any old <p> tag
        expect(screen.getAllByTestId("paragraph").length).toBeGreaterThanOrEqual(1);
    });
    it("reflects the current state in .props", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p())
        });
        expect(view.state).toBe(view.props.state);
    });
    it("calls handleScrollToSelection when appropriate", async ()=>{
        let scrolled = 0;
        const { view  } = tempEditor({
            doc: doc(p()),
            handleScrollToSelection: ()=>{
                scrolled++;
                return false;
            }
        });
        view.dispatch(view.state.tr.scrollIntoView());
        expect(scrolled).toBe(1);
    });
    it("can be queried for the DOM position at a doc position", async ()=>{
        const { view  } = tempEditor({
            doc: doc(ul(li(p(strong("foo")))))
        });
        const inText = view.domAtPos(4);
        expect(inText.offset).toBe(1);
        expect(inText.node.nodeValue).toBe("foo");
        const beforeLI = view.domAtPos(1);
        expect(beforeLI.offset).toBe(0);
        expect(beforeLI.node.nodeName).toBe("UL");
        const afterP = view.domAtPos(7);
        expect(afterP.offset).toBe(1);
        expect(afterP.node.nodeName).toBe("LI");
    });
    it("can bias DOM position queries to enter nodes", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p(em(strong("a"), "b"), "c"))
        });
        function get(pos, bias) {
            const r = view.domAtPos(pos, bias);
            return (r.node.nodeType == 1 ? r.node.nodeName : r.node.nodeValue) + "@" + r.offset;
        }
        expect(get(1, 0)).toBe("P@0");
        expect(get(1, -1)).toBe("P@0");
        expect(get(1, 1)).toBe("a@0");
        expect(get(2, -1)).toBe("a@1");
        expect(get(2, 0)).toBe("EM@1");
        expect(get(2, 1)).toBe("b@0");
        expect(get(3, -1)).toBe("b@1");
        expect(get(3, 0)).toBe("P@1");
        expect(get(3, 1)).toBe("c@0");
        expect(get(4, -1)).toBe("c@1");
        expect(get(4, 0)).toBe("P@2");
        expect(get(4, 1)).toBe("P@2");
    });
    it("can be queried for a node's DOM representation", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foo"), hr())
        });
        expect(view.nodeDOM(0).nodeName).toBe("P");
        expect(view.nodeDOM(5).nodeName).toBe("HR");
        expect(view.nodeDOM(3)).toBeNull();
    });
    it("can map DOM positions to doc positions", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foo"), hr())
        });
        expect(view.posAtDOM(view.dom.firstChild.firstChild, 2)).toBe(3);
        expect(view.posAtDOM(view.dom, 1)).toBe(5);
        expect(view.posAtDOM(view.dom, 2)).toBe(6);
        expect(view.posAtDOM(view.dom.lastChild, 0, -1)).toBe(5);
        expect(view.posAtDOM(view.dom.lastChild, 0, 1)).toBe(6);
    });
    it("binds this to itself in dispatchTransaction prop", async ()=>{
        let thisBinding;
        const { view  } = tempEditor({
            doc: doc(p("foo"), hr()),
            dispatchTransaction () {
                // eslint-disable-next-line @typescript-eslint/no-this-alias
                thisBinding = this;
            }
        });
        view.dispatch(view.state.tr.insertText("x"));
        expect(view).toBe(thisBinding);
    });
    it("replaces the EditorView when ProseMirror would redraw", async ()=>{
        const viewPlugin = ()=>new Plugin({
                props: {
                    nodeViews: {
                        horizontal_rule () {
                            const dom = document.createElement("hr");
                            return {
                                dom
                            };
                        }
                    }
                }
            });
        const startDoc = doc(p());
        const firstState = EditorState.create({
            doc: startDoc,
            schema,
            plugins: [
                viewPlugin(),
                reactKeys()
            ]
        });
        let firstView = null;
        let secondView = null;
        function Test() {
            useEditorEffect((v)=>{
                if (firstView === null) {
                    firstView = v;
                } else {
                    secondView = v;
                }
            });
            return null;
        }
        const Paragraph = /*#__PURE__*/ forwardRef(function Paragraph(param, ref) {
            let { nodeProps , children , ...props } = param;
            return /*#__PURE__*/ React.createElement("p", _extends({
                ref: ref,
                "data-testid": "node-view"
            }, props), children);
        });
        const { rerender  } = render(/*#__PURE__*/ React.createElement(ProseMirror, {
            state: firstState,
            nodeViews: {
                paragraph: Paragraph
            }
        }, /*#__PURE__*/ React.createElement(Test, null), /*#__PURE__*/ React.createElement(ProseMirrorDoc, null)));
        expect(()=>screen.getByTestId("node-view")).not.toThrow();
        const secondState = EditorState.create({
            doc: startDoc,
            schema,
            plugins: [
                viewPlugin(),
                reactKeys()
            ]
        });
        rerender(/*#__PURE__*/ React.createElement(ProseMirror, {
            state: secondState,
            nodeViews: {
                paragraph: Paragraph
            }
        }, /*#__PURE__*/ React.createElement(Test, null), /*#__PURE__*/ React.createElement(ProseMirrorDoc, null)));
        expect(()=>screen.getByTestId("node-view")).not.toThrow();
        expect(firstView).not.toBeNull();
        expect(secondView).not.toBeNull();
        expect(firstView === secondView).toBeFalsy();
    });
    it("supports focusing interactive controls", async ()=>{
        tempEditor({
            doc: doc(hr()),
            nodeViews: {
                horizontal_rule: /*#__PURE__*/ forwardRef(function Button(param, ref) {
                    let { nodeProps , ...props } = param;
                    useStopEvent(()=>{
                        return true;
                    });
                    return /*#__PURE__*/ React.createElement("button", _extends({
                        id: "button",
                        ref: ref,
                        type: "button"
                    }, props), "Click me");
                })
            }
        });
        const button = screen.getByText("Click me");
        await $("#button").click();
        expect(document.activeElement === button).toBeTruthy();
    });
});
