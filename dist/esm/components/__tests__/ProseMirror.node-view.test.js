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
import { act } from "@testing-library/react";
import { Plugin } from "prosemirror-state";
import { blockquote, br, doc, p } from "prosemirror-test-builder";
import { Decoration, DecorationSet } from "prosemirror-view";
import React, { forwardRef, useEffect } from "react";
import { tempEditor } from "../../testing/editorViewTestHelpers.js";
describe("React-based node views prop", ()=>{
    it("can replace a node's representation", ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foo", br())),
            nodeViews: {
                hard_break: /*#__PURE__*/ forwardRef(function Var(props, ref) {
                    return /*#__PURE__*/ React.createElement("var", {
                        ref: ref
                    }, props.children);
                })
            }
        });
        expect(view.dom.querySelector("var")).not.toBeNull();
    });
    it("can override drawing of a node's content", ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foo")),
            nodeViews: {
                paragraph: /*#__PURE__*/ forwardRef(function Paragraph(props, ref) {
                    return /*#__PURE__*/ React.createElement("p", {
                        ref: ref
                    }, props.nodeProps.node.textContent.toUpperCase());
                })
            }
        });
        expect(view.dom.querySelector("p").textContent).toBe("FOO");
        act(()=>{
            view.dispatch(view.state.tr.insertText("a"));
        });
        expect(view.dom.querySelector("p").textContent).toBe("AFOO");
    });
    // React makes this more or less trivial; the render
    // method of the component _is_ the update (and create)
    // method
    // eslint-disable-next-line jest/no-disabled-tests
    it.skip("can register its own update method", ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foo")),
            nodeViews: {
                paragraph: /*#__PURE__*/ forwardRef(function Paragraph(props, ref) {
                    return /*#__PURE__*/ React.createElement("p", {
                        ref: ref
                    }, props.nodeProps.node.textContent.toUpperCase());
                })
            }
        });
        const para = view.dom.querySelector("p");
        view.dispatch(view.state.tr.insertText("a"));
        expect(view.dom.querySelector("p")).toBe(para);
        expect(para.textContent).toBe("AFOO");
    });
    it("allows decoration updates for node views with an update method", ()=>{
        const { view , rerender  } = tempEditor({
            doc: doc(p("foo")),
            nodeViews: {
                paragraph: /*#__PURE__*/ forwardRef(function Paragraph(param, ref) {
                    let { children , nodeProps , ...props } = param;
                    return /*#__PURE__*/ React.createElement("p", _extends({
                        ref: ref
                    }, props), children);
                })
            }
        });
        rerender({
            decorations (state) {
                return DecorationSet.create(state.doc, [
                    Decoration.inline(2, 3, {
                        someattr: "ok"
                    }),
                    Decoration.node(0, 5, {
                        otherattr: "ok"
                    })
                ]);
            }
        });
        expect(view.dom.querySelector("[someattr]")).not.toBeNull();
        expect(view.dom.querySelector("[otherattr]")).not.toBeNull();
    });
    it("can provide a contentDOM property", ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foo")),
            nodeViews: {
                paragraph: /*#__PURE__*/ forwardRef(function Paragraph(props, ref) {
                    return(// ContentDOM is inferred from where props.children is rendered
                    /*#__PURE__*/ React.createElement("p", {
                        ref: ref
                    }, props.children));
                })
            }
        });
        const para = view.dom.querySelector("p");
        act(()=>{
            view.dispatch(view.state.tr.insertText("a"));
        });
        expect(view.dom.querySelector("p")).toBe(para);
        expect(para.textContent).toBe("afoo");
    });
    it("has its destroy method called", ()=>{
        let destroyed = false;
        const { view  } = tempEditor({
            doc: doc(p("foo", br())),
            nodeViews: {
                hard_break: /*#__PURE__*/ forwardRef(function BR(_props, ref) {
                    // React implements "destroy methods" with effect
                    // hooks
                    useEffect(()=>{
                        return ()=>{
                            destroyed = true;
                        };
                    }, []);
                    return /*#__PURE__*/ React.createElement("br", {
                        ref: ref
                    });
                })
            }
        });
        expect(destroyed).toBeFalsy();
        act(()=>{
            view.dispatch(view.state.tr.delete(3, 5));
        });
        expect(destroyed).toBeTruthy();
    });
    it("can query its own position", ()=>{
        let pos;
        const { view  } = tempEditor({
            doc: doc(blockquote(p("abc"), p("foo", br()))),
            nodeViews: {
                hard_break: /*#__PURE__*/ forwardRef(function BR(props, ref) {
                    pos = props.nodeProps.pos;
                    return /*#__PURE__*/ React.createElement("br", {
                        ref: ref
                    });
                })
            }
        });
        expect(pos).toBe(10);
        act(()=>{
            view.dispatch(view.state.tr.insertText("a"));
        });
        expect(pos).toBe(11);
    });
    it("has access to outer decorations", ()=>{
        const plugin = new Plugin({
            state: {
                init () {
                    return null;
                },
                apply (tr, prev) {
                    return tr.getMeta("setDeco") || prev;
                }
            },
            props: {
                decorations (state) {
                    const deco = this.getState(state);
                    return deco && DecorationSet.create(state.doc, [
                        Decoration.inline(0, state.doc.content.size, {}, {
                            name: deco
                        })
                    ]);
                }
            }
        });
        const { view  } = tempEditor({
            doc: doc(p("foo", br())),
            plugins: [
                plugin
            ],
            nodeViews: {
                hard_break: /*#__PURE__*/ forwardRef(function Var(props, ref) {
                    return /*#__PURE__*/ React.createElement("var", {
                        ref: ref
                    }, props.nodeProps.decorations.length ? props.nodeProps.decorations[0].spec.name : "[]");
                })
            }
        });
        expect(view.dom.querySelector("var").textContent).toBe("[]");
        act(()=>{
            view.dispatch(view.state.tr.setMeta("setDeco", "foo"));
        });
        expect(view.dom.querySelector("var").textContent).toBe("foo");
        act(()=>{
            view.dispatch(view.state.tr.setMeta("setDeco", "bar"));
        });
        expect(view.dom.querySelector("var").textContent).toBe("bar");
    });
    it("provides access to inner decorations in the constructor", ()=>{
        tempEditor({
            doc: doc(p("foo")),
            nodeViews: {
                paragraph: /*#__PURE__*/ forwardRef(function Paragraph(props, ref) {
                    expect(props.nodeProps.innerDecorations.find().map((d)=>`${d.from}-${d.to}`).join()).toBe("1-2");
                    return /*#__PURE__*/ React.createElement("p", {
                        ref: ref
                    }, props.children);
                })
            },
            decorations (state) {
                return DecorationSet.create(state.doc, [
                    Decoration.inline(2, 3, {
                        someattr: "ok"
                    }),
                    Decoration.node(0, 5, {
                        otherattr: "ok"
                    })
                ]);
            }
        });
    });
    it("provides access to inner decorations in the update method", ()=>{
        let innerDecos = [];
        const { rerender  } = tempEditor({
            doc: doc(p("foo")),
            nodeViews: {
                paragraph: /*#__PURE__*/ forwardRef(function Paragraph(props, ref) {
                    innerDecos = props.nodeProps.innerDecorations.find().map((d)=>`${d.from}-${d.to}`);
                    return /*#__PURE__*/ React.createElement("p", {
                        ref: ref
                    }, props.children);
                })
            }
        });
        rerender({
            decorations (state) {
                return DecorationSet.create(state.doc, [
                    Decoration.inline(2, 3, {
                        someattr: "ok"
                    }),
                    Decoration.node(0, 5, {
                        otherattr: "ok"
                    })
                ]);
            }
        });
        expect(innerDecos.join()).toBe("1-2");
    });
});
describe("Classic node views prop", ()=>{
    it("can replace a node's representation", ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foo", br())),
            customNodeViews: {
                hard_break () {
                    return {
                        dom: document.createElement("var")
                    };
                }
            }
        });
        expect(view.dom.querySelector("var")).not.toBeNull();
    });
    it("can override drawing of a node's content", ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foo")),
            customNodeViews: {
                paragraph (node) {
                    const dom = document.createElement("p");
                    dom.textContent = node.textContent.toUpperCase();
                    return {
                        dom
                    };
                }
            }
        });
        expect(view.dom.querySelector("p").textContent).toBe("FOO");
        act(()=>{
            view.dispatch(view.state.tr.insertText("a"));
        });
        // TODO: Fix this. I think that ProseMirror's behavior is to
        // call the constructor again in this scenario.
        expect(view.dom.querySelector("p").textContent).toBe("AFOO");
    });
    it("can register its own update method", ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foo")),
            customNodeViews: {
                paragraph (node) {
                    const dom = document.createElement("p");
                    dom.textContent = node.textContent.toUpperCase();
                    return {
                        dom,
                        update (node) {
                            dom.textContent = node.textContent.toUpperCase();
                            return true;
                        }
                    };
                }
            }
        });
        const para = view.dom.querySelector("p");
        act(()=>{
            view.dispatch(view.state.tr.insertText("a"));
        });
        expect(view.dom.querySelector("p")).toBe(para);
        expect(para.textContent).toBe("AFOO");
    });
    it("allows decoration updates for node views with an update method", ()=>{
        const { view , rerender  } = tempEditor({
            doc: doc(p("foo")),
            customNodeViews: {
                paragraph (node) {
                    const dom = document.createElement("p");
                    return {
                        dom,
                        contentDOM: dom,
                        update (node_) {
                            return node.sameMarkup(node_);
                        }
                    };
                }
            }
        });
        rerender({
            decorations (state) {
                return DecorationSet.create(state.doc, [
                    Decoration.inline(2, 3, {
                        someattr: "ok"
                    }),
                    Decoration.node(0, 5, {
                        otherattr: "ok"
                    })
                ]);
            }
        });
        expect(view.dom.querySelector("[someattr]")).not.toBeNull();
        expect(view.dom.querySelector("[otherattr]")).not.toBeNull();
    });
    it("can provide a contentDOM property", ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foo")),
            customNodeViews: {
                paragraph () {
                    const dom = document.createElement("p");
                    return {
                        dom,
                        contentDOM: dom
                    };
                }
            }
        });
        const para = view.dom.querySelector("p");
        act(()=>{
            view.dispatch(view.state.tr.insertText("a"));
        });
        expect(view.dom.querySelector("p")).toBe(para);
        expect(para.textContent).toBe("afoo");
    });
    it("has its destroy method called", ()=>{
        let destroyed = false;
        const { view  } = tempEditor({
            doc: doc(p("foo", br())),
            customNodeViews: {
                hard_break () {
                    return {
                        dom: document.createElement("br"),
                        destroy: ()=>destroyed = true
                    };
                }
            }
        });
        expect(destroyed).toBeFalsy();
        act(()=>{
            view.dispatch(view.state.tr.delete(3, 5));
        });
        expect(destroyed).toBeTruthy();
    });
    it("can query its own position", ()=>{
        let get;
        const { view  } = tempEditor({
            doc: doc(blockquote(p("abc"), p("foo", br()))),
            customNodeViews: {
                hard_break (_n, _v, getPos) {
                    expect(getPos()).toBe(10);
                    get = getPos;
                    return {
                        dom: document.createElement("br")
                    };
                }
            }
        });
        expect(get()).toBe(10);
        act(()=>{
            view.dispatch(view.state.tr.insertText("a"));
        });
        expect(get()).toBe(11);
    });
    it("has access to outer decorations", ()=>{
        const plugin = new Plugin({
            state: {
                init () {
                    return null;
                },
                apply (tr, prev) {
                    return tr.getMeta("setDeco") || prev;
                }
            },
            props: {
                decorations (state) {
                    const deco = this.getState(state);
                    return deco && DecorationSet.create(state.doc, [
                        Decoration.inline(0, state.doc.content.size, {}, {
                            name: deco
                        })
                    ]);
                }
            }
        });
        const { view  } = tempEditor({
            doc: doc(p("foo", br())),
            plugins: [
                plugin
            ],
            customNodeViews: {
                hard_break (_n, _v, _p, deco) {
                    const dom = document.createElement("var");
                    function update(deco) {
                        dom.textContent = deco.length ? deco[0].spec.name : "[]";
                    }
                    update(deco);
                    return {
                        dom,
                        update (_, deco) {
                            update(deco);
                            return true;
                        }
                    };
                }
            }
        });
        expect(view.dom.querySelector("var").textContent).toBe("[]");
        act(()=>{
            view.dispatch(view.state.tr.setMeta("setDeco", "foo"));
        });
        expect(view.dom.querySelector("var").textContent).toBe("foo");
        act(()=>{
            view.dispatch(view.state.tr.setMeta("setDeco", "bar"));
        });
        expect(view.dom.querySelector("var").textContent).toBe("bar");
    });
    it("provides access to inner decorations in the constructor", ()=>{
        tempEditor({
            doc: doc(p("foo")),
            customNodeViews: {
                paragraph (_node, _v, _pos, _outer, innerDeco) {
                    const dom = document.createElement("p");
                    expect(innerDeco.find().map((d)=>`${d.from}-${d.to}`).join()).toBe("1-2");
                    return {
                        dom,
                        contentDOM: dom
                    };
                }
            },
            decorations (state) {
                return DecorationSet.create(state.doc, [
                    Decoration.inline(2, 3, {
                        someattr: "ok"
                    }),
                    Decoration.node(0, 5, {
                        otherattr: "ok"
                    })
                ]);
            }
        });
    });
    it("provides access to inner decorations in the update method", ()=>{
        let innerDecos = [];
        const { rerender  } = tempEditor({
            doc: doc(p("foo")),
            customNodeViews: {
                paragraph (node) {
                    const dom = document.createElement("p");
                    return {
                        dom,
                        contentDOM: dom,
                        update (node_, _, innerDecoSet) {
                            innerDecos = innerDecoSet.find().map((d)=>`${d.from}-${d.to}`);
                            return node.sameMarkup(node_);
                        }
                    };
                }
            }
        });
        rerender({
            decorations (state) {
                return DecorationSet.create(state.doc, [
                    Decoration.inline(2, 3, {
                        someattr: "ok"
                    }),
                    Decoration.node(0, 5, {
                        otherattr: "ok"
                    })
                ]);
            }
        });
        expect(innerDecos.join()).toBe("1-2");
    });
});
