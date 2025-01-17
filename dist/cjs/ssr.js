/* eslint-disable @typescript-eslint/no-empty-function */ /**
 * @fileoverview
 *
 * Stubs for ProseMirror View during SSR. These are extremely
 * barebones, because they _do not need to actually work_. They
 * just need to prevent errors from being thrown when ProseMirror
 * View attemps to access these APIs while constructing the
 * initial EditorView. None of these APIs are necessary for SSR to
 * work properly, so it's fine that they're all no-ops.
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "setSsrStubs", {
    enumerable: true,
    get: ()=>setSsrStubs
});
let ClassList = class ClassList {
    add() {}
    remove() {}
};
let ElementStub = class ElementStub {
    get parent() {
        return new ElementStub();
    }
    get parentNode() {
        return new ElementStub();
    }
    appendChild() {
        return new ElementStub();
    }
    setAttribute() {}
    hasAttribute() {
        return false;
    }
    insertBefore() {}
    get classList() {
        return new ClassList();
    }
    get ownerDocument() {
        return new DocumentStub();
    }
    addEventListener() {}
    removeEventListener() {}
    replaceChildren() {}
    constructor(){
        this.nodeName = "div";
        this.style = {};
    }
};
let DocumentStub = class DocumentStub {
    createElement() {
        return new ElementStub();
    }
    addEventListener() {}
    removeEventListener() {}
    get documentElement() {
        return new ElementStub();
    }
};
function setSsrStubs() {
    const prevWindow = globalThis.window;
    // @ts-expect-error HACK - EditorView checks for window.MutationObserver
    // in its constructor, which breaks SSR. We temporarily set window
    // to an empty object to prevent an error from being thrown, and then
    // clean it up so that other isomorphic code doesn't get confused about
    // whether there's a functioning global window object
    globalThis.window ??= {
        visualViewport: null
    };
    const prevDocument = globalThis.document;
    // @ts-expect-error HACK: This is only used during SSR, and only
    // to prevent outright errors when ProseMirror View attempts to
    // access document properties either on import or when constructing
    // the EditorView.
    globalThis.document ??= new DocumentStub();
    return function cleanupSsrStubs() {
        if (globalThis.window !== prevWindow) {
            globalThis.window = prevWindow;
        }
        if (globalThis.document !== prevDocument) {
            globalThis.document = prevDocument;
        }
    };
}
