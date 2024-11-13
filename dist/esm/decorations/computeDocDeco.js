import { Decoration } from "prosemirror-view";
const DocDecorationsCache = new WeakMap();
/**
 * Produces the outer decorations for the doc node, based
 * on the attributes editor prop.
 *
 * The return value of this function is memoized; if it is to
 * return an equivalent value to the last time it was called for
 * a given EditorView, it will return exactly that previous value.
 *
 * This makes it safe to call in a React render function, even
 * if its result is used in a dependencies array for a hook.
 */ export function computeDocDeco(view) {
    const attrs = Object.create(null);
    attrs.class = "ProseMirror";
    attrs.contenteditable = String(view.editable);
    view.someProp("attributes", (value)=>{
        if (typeof value == "function") value = value(view.state);
        if (value) for(const attr in value){
            if (attr == "class") attrs.class += " " + value[attr];
            else if (attr == "style") attrs.style = (attrs.style ? attrs.style + ";" : "") + value[attr];
            else if (!attrs[attr] && attr != "contenteditable" && attr != "nodeName") attrs[attr] = String(value[attr]);
        }
    });
    if (!attrs.translate) attrs.translate = "no";
    const next = [
        Decoration.node(0, view.state.doc.content.size, attrs)
    ];
    const previous = DocDecorationsCache.get(view);
    if (!previous) {
        DocDecorationsCache.set(view, next);
        return next;
    }
    if (previous[0].to !== view.state.doc.content.size) {
        DocDecorationsCache.set(view, next);
        return next;
    }
    // @ts-expect-error Internal property (Decoration.type)
    if (!previous[0].type.eq(next[0].type)) {
        DocDecorationsCache.set(view, next);
        return next;
    }
    return previous;
}
