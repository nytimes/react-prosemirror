/* eslint-disable jest/no-disabled-tests */ /* eslint-disable @typescript-eslint/no-explicit-any */ /* eslint-disable @typescript-eslint/no-non-null-assertion */ import { act, screen } from "@testing-library/react";
import { NodeSelection, Selection } from "prosemirror-state";
import { blockquote, br, code, code_block, doc, em, hr, img as img_, li, p, strong, ul } from "prosemirror-test-builder";
import { Decoration, DecorationSet } from "prosemirror-view";
import { tempEditor } from "../../testing/editorViewTestHelpers.js";
const img = img_({
    src: "data:image/gif;base64,R0lGODlhBQAFAIABAAAAAP///yH5BAEKAAEALAAAAAAFAAUAAAIEjI+pWAA7"
});
async function findTextNode(_, text) {
    const parent = await screen.findByText(text);
    return parent.firstChild;
}
function allPositions(doc) {
    const found = [];
    function scan(node, start) {
        if (node.isTextblock) {
            for(let i = 0; i <= node.content.size; i++)found.push(start + i);
        } else {
            node.forEach((child, offset)=>scan(child, start + offset + 1));
        }
    }
    scan(doc, 0);
    return found;
}
function setDOMSel(node, offset) {
    const range = document.createRange();
    range.setEnd(node, offset);
    range.setStart(node, offset);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}
function getSel() {
    const sel = window.getSelection();
    let node = sel.focusNode, offset = sel.focusOffset;
    while(node && node.nodeType != 3){
        const after = offset < node.childNodes.length && node.childNodes[offset];
        const before = offset > 0 && node.childNodes[offset - 1];
        if (after) {
            node = after;
            offset = 0;
        } else if (before) {
            node = before;
            offset = node.nodeType == 3 ? node.nodeValue.length : node.childNodes.length;
        } else break;
    }
    return {
        node: node,
        offset: offset
    };
}
function setSel(view, sel) {
    const selection = typeof sel == "number" ? Selection.near(view.state.doc.resolve(sel)) : sel;
    act(()=>{
        view.dispatch(view.state.tr.setSelection(selection));
    });
}
function event(code) {
    const event = document.createEvent("Event");
    event.initEvent("keydown", true, true);
    event.keyCode = code;
    return event;
}
const LEFT = 37, RIGHT = 39, UP = 38, DOWN = 40;
describe("ProseMirror", ()=>{
    it("can read the DOM selection", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("one"), hr(), blockquote(p("two")))
        });
        function test(node, offset, expected) {
            setDOMSel(node, offset);
            view.dom.focus();
            act(()=>{
                view.domObserver.flush();
            });
            const sel = view.state.selection;
            expect(sel.head == null ? sel.from : sel.head).toBe(expected);
        }
        const one = await findTextNode(view.dom, "one");
        const two = await findTextNode(view.dom, "two");
        test(one, 0, 1);
        test(one, 1, 2);
        test(one, 3, 4);
        test(one.parentNode, 0, 1);
        test(one.parentNode, 1, 4);
        test(two, 0, 8);
        test(two, 3, 11);
        test(two.parentNode, 1, 11);
        test(view.dom, 1, 4);
        test(view.dom, 2, 8);
        test(view.dom, 3, 11);
    });
    it("syncs the DOM selection with the editor selection", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("one"), hr(), blockquote(p("two")))
        });
        function test(pos, node, offset) {
            setSel(view, pos);
            const sel = getSel();
            expect(sel.node).toBe(node);
            expect(sel.offset).toBe(offset);
        }
        const one = await findTextNode(view.dom, "one");
        const two = await findTextNode(view.dom, "two");
        view.focus();
        test(1, one, 0);
        test(2, one, 1);
        test(4, one, 3);
        test(8, two, 0);
        test(10, two, 2);
    });
    it("returns sensible screen coordinates", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("one"), p("two"))
        });
        const p00 = view.coordsAtPos(1);
        const p01 = view.coordsAtPos(2);
        const p03 = view.coordsAtPos(4);
        const p10 = view.coordsAtPos(6);
        const p13 = view.coordsAtPos(9);
        expect(p00.bottom).toBeGreaterThan(p00.top);
        expect(p13.bottom).toBeGreaterThan(p13.top);
        expect(p00.top).toEqual(p01.top);
        expect(p01.top).toEqual(p03.top);
        expect(p00.bottom).toEqual(p03.bottom);
        expect(p10.top).toEqual(p13.top);
        expect(p01.left).toBeGreaterThan(p00.left);
        expect(p03.left).toBeGreaterThan(p01.left);
        expect(p10.top).toBeGreaterThan(p00.top);
        expect(p13.left).toBeGreaterThan(p10.left);
    });
    it("returns proper coordinates in code blocks", async ()=>{
        const { view  } = tempEditor({
            doc: doc(code_block("a\nb\n"))
        }), p = [];
        for(let i = 1; i <= 5; i++)p.push(view.coordsAtPos(i));
        const [p0, p1, p2, p3, p4] = p;
        expect(p0.top).toBe(p1.top);
        expect(p0.left).toBeLessThan(p1.left);
        expect(p2.top).toBeGreaterThan(p1.top);
        expect(p2.top).toBe(p3.top);
        expect(p2.left).toBeLessThan(p3.left);
        expect(p2.left).toBe(p0.left);
        expect(p4.top).toBeGreaterThan(p3.top);
        // This one shows a small (0.01 pixel) difference in Firefox for
        // some reason.
        expect(Math.round(p4.left)).toBe(Math.round(p2.left));
    });
    // TODO: This test fails on the position between the img and the br (it returns
    // the position before the img, instead of after).
    it.skip("produces sensible screen coordinates in corner cases", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("one", em("two", strong("three"), img), br(), code("foo")), p())
        });
        return new Promise((ok)=>{
            setTimeout(()=>{
                allPositions(view.state.doc).forEach((pos)=>{
                    const coords = view.coordsAtPos(pos);
                    const found = view.posAtCoords({
                        top: coords.top + 1,
                        left: coords.left
                    }).pos;
                    expect(found).toBe(pos);
                    setSel(view, pos);
                });
                ok(null);
            }, 20);
        });
    });
    it("doesn't return zero-height rectangles after leaves", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p(img))
        });
        const coords = view.coordsAtPos(2, 1);
        expect(coords.bottom - coords.top).toBeGreaterThan(5);
    });
    it("produces horizontal rectangles for positions between blocks", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("ha"), hr(), blockquote(p("ba")))
        });
        const a = view.coordsAtPos(0);
        expect(a.top).toBe(a.bottom);
        expect(a.top).toBe(view.dom.firstChild.getBoundingClientRect().top);
        expect(a.left).toBeLessThan(a.right);
        const b = view.coordsAtPos(4);
        expect(b.top).toBe(b.bottom);
        expect(b.top).toBeGreaterThan(a.top);
        expect(b.left).toBeLessThan(b.right);
        const c = view.coordsAtPos(5);
        expect(c.top).toBe(c.bottom);
        expect(c.top).toBeGreaterThan(b.top);
        const d = view.coordsAtPos(6);
        expect(d.top).toBe(d.bottom);
        expect(d.left).toBeLessThan(d.right);
        expect(d.top).toBeLessThan(view.dom.getBoundingClientRect().bottom);
    });
    it("produces sensible screen coordinates around line breaks", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("one two three four five-six-seven-eight"))
        });
        function afterSpace(pos) {
            return pos > 0 && view.state.doc.textBetween(pos - 1, pos) == " ";
        }
        view.dom.style.width = "4em";
        let prevBefore;
        let prevAfter;
        allPositions(view.state.doc).forEach((pos)=>{
            const coords = view.coordsAtPos(pos, 1);
            if (prevAfter) // eslint-disable-next-line jest/no-conditional-expect
            expect(prevAfter.top < coords.top || prevAfter.top == coords.top && prevAfter.left < coords.left).toBeTruthy();
            prevAfter = coords;
            const found = view.posAtCoords({
                top: coords.top + 1,
                left: coords.left
            }).pos;
            expect(found).toBe(pos);
            const coordsBefore = view.coordsAtPos(pos, -1);
            if (prevBefore) // eslint-disable-next-line jest/no-conditional-expect
            expect(prevBefore.top < coordsBefore.top || prevBefore.top == coordsBefore.top && (prevBefore.left < coordsBefore.left || afterSpace(pos) && prevBefore.left == coordsBefore.left)).toBeTruthy();
            prevBefore = coordsBefore;
        });
    });
    it("can find coordinates on node boundaries", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("one ", em("two"), " ", em(strong("three"))))
        });
        let prev;
        allPositions(view.state.doc).forEach((pos)=>{
            const coords = view.coordsAtPos(pos, 1);
            if (prev) // eslint-disable-next-line jest/no-conditional-expect
            expect(prev.top < coords.top || Math.abs(prev.top - coords.top) < 4 && prev.left < coords.left).toBeTruthy();
            prev = coords;
        });
    });
    it("finds proper coordinates in RTL text", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("مرآة نثرية"))
        });
        view.dom.style.direction = "rtl";
        let prev;
        allPositions(view.state.doc).forEach((pos)=>{
            const coords = view.coordsAtPos(pos, 1);
            if (prev) // eslint-disable-next-line jest/no-conditional-expect
            expect(prev.top < coords.top || Math.abs(prev.top - coords.top) < 4 && prev.left > coords.left).toBeTruthy();
            prev = coords;
        });
    });
    it("can go back and forth between screen coordsa and document positions", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("one"), blockquote(p("two"), p("three")))
        });
        [
            1,
            2,
            4,
            7,
            14,
            15
        ].forEach((pos)=>{
            const coords = view.coordsAtPos(pos);
            const found = view.posAtCoords({
                top: coords.top + 1,
                left: coords.left
            }).pos;
            expect(found).toBe(pos);
        });
    });
    it("returns correct screen coordinates for wrapped lines", async ()=>{
        const { view  } = tempEditor({});
        const top = view.coordsAtPos(1);
        let pos = 1, end;
        for(let i = 0; i < 100; i++){
            view.dispatch(view.state.tr.insertText("a bc de fg h"));
            pos += 12;
            end = view.coordsAtPos(pos);
            if (end.bottom > top.bottom + 4) break;
        }
        expect(view.posAtCoords({
            left: end.left + 50,
            top: end.top + 5
        }).pos).toBe(pos);
    });
    it("makes arrow motion go through selectable inline nodes", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foo<a>", img, "bar"))
        });
        act(()=>{
            view.dispatchEvent(event(RIGHT));
        });
        expect(view.state.selection.from).toBe(4);
        act(()=>{
            view.dispatchEvent(event(RIGHT));
        });
        expect(view.state.selection.head).toBe(5);
        expect(view.state.selection.anchor).toBe(5);
        act(()=>{
            view.dispatchEvent(event(LEFT));
        });
        expect(view.state.selection.from).toBe(4);
        act(()=>{
            view.dispatchEvent(event(LEFT));
        });
        expect(view.state.selection.head).toBe(4);
        expect(view.state.selection.anchor).toBe(4);
    });
    it("makes arrow motion go through selectable block nodes", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("hello<a>"), hr(), ul(li(p("there"))))
        });
        act(()=>{
            view.dispatchEvent(event(DOWN));
        });
        expect(view.state.selection.from).toBe(7);
        setSel(view, 11);
        act(()=>{
            view.dispatchEvent(event(UP));
        });
        expect(view.state.selection.from).toBe(7);
    });
    it("supports arrow motion through adjacent blocks", async ()=>{
        const { view  } = tempEditor({
            doc: doc(blockquote(p("hello<a>")), hr(), hr(), p("there"))
        });
        act(()=>{
            view.dispatchEvent(event(DOWN));
        });
        expect(view.state.selection.from).toBe(9);
        act(()=>{
            view.dispatchEvent(event(DOWN));
        });
        expect(view.state.selection.from).toBe(10);
        setSel(view, 14);
        act(()=>{
            view.dispatchEvent(event(UP));
        });
        expect(view.state.selection.from).toBe(10);
        act(()=>{
            view.dispatchEvent(event(UP));
        });
        expect(view.state.selection.from).toBe(9);
    });
    it("support horizontal motion through blocks", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foo<a>"), hr(), hr(), p("bar"))
        });
        act(()=>{
            view.dispatchEvent(event(RIGHT));
        });
        expect(view.state.selection.from).toBe(5);
        act(()=>{
            view.dispatchEvent(event(RIGHT));
        });
        expect(view.state.selection.from).toBe(6);
        act(()=>{
            view.dispatchEvent(event(RIGHT));
        });
        expect(view.state.selection.head).toBe(8);
        act(()=>{
            view.dispatchEvent(event(LEFT));
        });
        expect(view.state.selection.from).toBe(6);
        act(()=>{
            view.dispatchEvent(event(LEFT));
        });
        expect(view.state.selection.from).toBe(5);
        act(()=>{
            view.dispatchEvent(event(LEFT));
        });
        expect(view.state.selection.head).toBe(4);
    });
    it("allows moving directly from an inline node to a block node", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p("foo", img), hr(), p(img, "bar"))
        });
        setSel(view, NodeSelection.create(view.state.doc, 4));
        act(()=>{
            view.dispatchEvent(event(DOWN));
        });
        expect(view.state.selection.from).toBe(6);
        setSel(view, NodeSelection.create(view.state.doc, 8));
        act(()=>{
            view.dispatchEvent(event(UP));
        });
        expect(view.state.selection.from).toBe(6);
    });
    it("updates the selection even if the DOM parameters look unchanged", async ()=>{
        const { view , rerender  } = tempEditor({
            doc: doc(p("foobar<a>"))
        });
        view.focus();
        const decos = DecorationSet.create(view.state.doc, [
            Decoration.inline(1, 4, {
                color: "green"
            })
        ]);
        rerender({
            decorations () {
                return decos;
            }
        });
        rerender({
            decorations: undefined
        });
        rerender({
            decorations () {
                return decos;
            }
        });
        const range = document.createRange();
        range.setEnd(document.getSelection().anchorNode, document.getSelection().anchorOffset);
        range.setStart(view.dom, 0);
        expect(range.toString()).toBe("foobar");
    });
    it("sets selection even if Selection.extend throws DOMException", async ()=>{
        const originalExtend = window.Selection.prototype.extend;
        window.Selection.prototype.extend = ()=>{
            // declare global: DOMException
            throw new DOMException("failed");
        };
        try {
            const { view  } = tempEditor({
                doc: doc(p("foo", img), hr(), p(img, "bar"))
            });
            setSel(view, NodeSelection.create(view.state.doc, 4));
            act(()=>{
                view.dispatchEvent(event(DOWN));
            });
            expect(view.state.selection.from).toBe(6);
        } finally{
            window.Selection.prototype.extend = originalExtend;
        }
    });
    it("doesn't put the cursor after BR hack nodes", async ()=>{
        const { view  } = tempEditor({
            doc: doc(p())
        });
        view.focus();
        expect(getSelection().focusOffset).toBe(0);
    });
});
