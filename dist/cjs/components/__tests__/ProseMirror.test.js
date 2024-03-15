/* eslint-disable @typescript-eslint/no-explicit-any */ /* eslint-disable @typescript-eslint/no-non-null-assertion */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _globals = require("@jest/globals");
const _react = require("@testing-library/react");
const _prosemirrorTestBuilder = require("prosemirror-test-builder");
const _editorViewTestHelpersJs = require("../../testing/editorViewTestHelpers.js");
const _setupProseMirrorViewJs = require("../../testing/setupProseMirrorView.js");
describe("EditorView", ()=>{
    beforeAll(()=>{
        (0, _setupProseMirrorViewJs.setupProseMirrorView)();
    });
    it("reflects the current state in .props", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)())
        });
        (0, _globals.expect)(view.state).toBe(view.props.state);
    });
    it("calls handleScrollToSelection when appropriate", ()=>{
        let scrolled = 0;
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)()),
            handleScrollToSelection: ()=>{
                scrolled++;
                return false;
            }
        });
        (0, _react.act)(()=>{
            view.dispatch(view.state.tr.scrollIntoView());
        });
        (0, _globals.expect)(scrolled).toBe(1);
    });
    it("can be queried for the DOM position at a doc position", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.ul)((0, _prosemirrorTestBuilder.li)((0, _prosemirrorTestBuilder.p)((0, _prosemirrorTestBuilder.strong)("foo")))))
        });
        const inText = view.domAtPos(4);
        (0, _globals.expect)(inText.offset).toBe(1);
        (0, _globals.expect)(inText.node.nodeValue).toBe("foo");
        const beforeLI = view.domAtPos(1);
        (0, _globals.expect)(beforeLI.offset).toBe(0);
        (0, _globals.expect)(beforeLI.node.nodeName).toBe("UL");
        const afterP = view.domAtPos(7);
        (0, _globals.expect)(afterP.offset).toBe(1);
        (0, _globals.expect)(afterP.node.nodeName).toBe("LI");
    });
    it("can bias DOM position queries to enter nodes", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)((0, _prosemirrorTestBuilder.em)((0, _prosemirrorTestBuilder.strong)("a"), "b"), "c"))
        });
        function get(pos, bias) {
            const r = view.domAtPos(pos, bias);
            return (r.node.nodeType == 1 ? r.node.nodeName : r.node.nodeValue) + "@" + r.offset;
        }
        (0, _globals.expect)(get(1, 0)).toBe("P@0");
        (0, _globals.expect)(get(1, -1)).toBe("P@0");
        (0, _globals.expect)(get(1, 1)).toBe("a@0");
        (0, _globals.expect)(get(2, -1)).toBe("a@1");
        (0, _globals.expect)(get(2, 0)).toBe("EM@1");
        (0, _globals.expect)(get(2, 1)).toBe("b@0");
        (0, _globals.expect)(get(3, -1)).toBe("b@1");
        (0, _globals.expect)(get(3, 0)).toBe("P@1");
        (0, _globals.expect)(get(3, 1)).toBe("c@0");
        (0, _globals.expect)(get(4, -1)).toBe("c@1");
        (0, _globals.expect)(get(4, 0)).toBe("P@2");
        (0, _globals.expect)(get(4, 1)).toBe("P@2");
    });
    it("can be queried for a node's DOM representation", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo"), (0, _prosemirrorTestBuilder.hr)())
        });
        (0, _globals.expect)(view.nodeDOM(0).nodeName).toBe("P");
        (0, _globals.expect)(view.nodeDOM(5).nodeName).toBe("HR");
        (0, _globals.expect)(view.nodeDOM(3)).toBeNull();
    });
    it("can map DOM positions to doc positions", ()=>{
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo"), (0, _prosemirrorTestBuilder.hr)())
        });
        (0, _globals.expect)(view.posAtDOM(view.dom.firstChild.firstChild, 2)).toBe(3);
        (0, _globals.expect)(view.posAtDOM(view.dom, 1)).toBe(5);
        (0, _globals.expect)(view.posAtDOM(view.dom, 2)).toBe(6);
        (0, _globals.expect)(view.posAtDOM(view.dom.lastChild, 0, -1)).toBe(5);
        (0, _globals.expect)(view.posAtDOM(view.dom.lastChild, 0, 1)).toBe(6);
    });
    it("binds this to itself in dispatchTransaction prop", ()=>{
        let thisBinding;
        const { view  } = (0, _editorViewTestHelpersJs.tempEditor)({
            doc: (0, _prosemirrorTestBuilder.doc)((0, _prosemirrorTestBuilder.p)("foo"), (0, _prosemirrorTestBuilder.hr)()),
            dispatchTransaction () {
                // eslint-disable-next-line @typescript-eslint/no-this-alias
                thisBinding = this;
            }
        });
        (0, _react.act)(()=>{
            view.dispatch(view.state.tr.insertText("x"));
        });
        (0, _globals.expect)(view).toBe(thisBinding);
    });
});
