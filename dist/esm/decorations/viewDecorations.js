import { DecorationSet } from "prosemirror-view";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const none = [], noSpec = {};
const empty = DecorationSet.empty;
// An abstraction that allows the code dealing with decorations to
// treat multiple DecorationSet objects as if it were a single object
// with (a subset of) the same interface.
let DecorationGroup = class DecorationGroup {
    map(mapping, doc) {
        const mappedDecos = this.members.map((member)=>member.map(mapping, doc, noSpec));
        return DecorationGroup.from(mappedDecos);
    }
    forChild(offset, child) {
        if (child.isLeaf) return DecorationSet.empty;
        let found = [];
        for(let i = 0; i < this.members.length; i++){
            const result = this.members[i].forChild(offset, child);
            if (result == empty) continue;
            if (result instanceof DecorationGroup) found = found.concat(result.members);
            else found.push(result);
        }
        return DecorationGroup.from(found);
    }
    eq(other) {
        if (!(other instanceof DecorationGroup) || other.members.length != this.members.length) return false;
        for(let i = 0; i < this.members.length; i++)if (!this.members[i].eq(other.members[i])) return false;
        return true;
    }
    locals(node) {
        let result, sorted = true;
        for(let i = 0; i < this.members.length; i++){
            const locals = this.members[i].localsInner(node);
            if (!locals.length) continue;
            if (!result) {
                result = locals;
            } else {
                if (sorted) {
                    result = result.slice();
                    sorted = false;
                }
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                for(let j = 0; j < locals.length; j++)result.push(locals[j]);
            }
        }
        return result ? removeOverlap(sorted ? result : result.sort(byPos)) : none;
    }
    // Create a group for the given array of decoration sets, or return
    // a single set when possible.
    static from(members) {
        switch(members.length){
            case 0:
                return empty;
            case 1:
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                return members[0];
            default:
                return new DecorationGroup(members.every((m)=>m instanceof DecorationSet) ? members : members.reduce((r, m)=>r.concat(m instanceof DecorationSet ? m : m.members), []));
        }
    }
    forEachSet(f) {
        for(let i = 0; i < this.members.length; i++)// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.members[i].forEachSet(f);
    }
    constructor(members){
        this.members = members;
    }
};
// Used to sort decorations so that ones with a low start position
// come first, and within a set with the same start position, those
// with an smaller end position come first.
function byPos(a, b) {
    return a.from - b.from || a.to - b.to;
}
// Scan a sorted array of decorations for partially overlapping spans,
// and split those so that only fully overlapping spans are left (to
// make subsequent rendering easier). Will return the input array if
// no partially overlapping spans are found (the common case).
function removeOverlap(spans) {
    let working = spans;
    for(let i = 0; i < working.length - 1; i++){
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const span = working[i];
        if (span.from != span.to) for(let j = i + 1; j < working.length; j++){
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const next = working[j];
            if (next.from == span.from) {
                if (next.to != span.to) {
                    if (working == spans) working = spans.slice();
                    // Followed by a partially overlapping larger span. Split that
                    // span.
                    working[j] = next.copy(next.from, span.to);
                    insertAhead(working, j + 1, next.copy(span.to, next.to));
                }
                continue;
            } else {
                if (next.from < span.to) {
                    if (working == spans) working = spans.slice();
                    // The end of this one overlaps with a subsequent span. Split
                    // this one.
                    working[i] = span.copy(span.from, next.from);
                    insertAhead(working, j, span.copy(next.from, span.to));
                }
                break;
            }
        }
    }
    return working;
}
function insertAhead(array, i, deco) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    while(i < array.length && byPos(deco, array[i]) > 0)i++;
    array.splice(i, 0, deco);
}
const ViewDecorationsCache = new WeakMap();
/**
 * Produces the DecorationSource for the current state, based
 * on the decorations editor prop.
 *
 * The return value of this function is memoized; if it is to
 * return an equivalent value to the last time it was called for
 * a given EditorView, it will return exactly that previous value.
 *
 * This makes it safe to call in a React render function, even
 * if its result is used in a dependencies array for a hook.
 */ export function viewDecorations(view, cursorWrapper) {
    const found = [];
    view.someProp("decorations", (f)=>{
        const result = f(view.state);
        if (result && result != empty) found.push(result);
    });
    // We don't have access to types for view.cursorWrapper here
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (cursorWrapper) {
        found.push(// eslint-disable-next-line @typescript-eslint/no-explicit-any
        DecorationSet.create(view.state.doc, [
            cursorWrapper
        ]));
    }
    const previous = ViewDecorationsCache.get(view);
    if (!previous) {
        const result = DecorationGroup.from(found);
        ViewDecorationsCache.set(view, result);
        return result;
    }
    let numPrevious = 0;
    let areSetsEqual = true;
    previous.forEachSet((set)=>{
        const next = found[numPrevious++];
        if (next !== set) {
            areSetsEqual = false;
        }
    });
    if (numPrevious !== found.length) {
        areSetsEqual = false;
    }
    if (!areSetsEqual) {
        const result = DecorationGroup.from(found);
        ViewDecorationsCache.set(view, result);
        return result;
    }
    return previous;
}
