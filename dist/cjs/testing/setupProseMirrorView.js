"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    setupProseMirrorView: ()=>setupProseMirrorView,
    teardownProseMirrorView: ()=>teardownProseMirrorView
});
let oldElementFromPoint;
let oldGetClientRects;
let oldGetBoundingClientRect;
const mockElementFromPoint = ()=>globalThis.document.body;
const mockGetBoundingClientRect = ()=>{
    return {
        bottom: 0,
        height: 0,
        left: 0,
        right: 0,
        top: 0,
        width: 0,
        x: 0,
        y: 0,
        toJSON () {
            return {
                bottom: 0,
                height: 0,
                left: 0,
                right: 0,
                top: 0,
                width: 0,
                x: 0,
                y: 0
            };
        }
    };
};
const mockGetClientRects = ()=>{
    const list = [
        {
            bottom: 0,
            height: 0,
            left: 0,
            right: 0,
            top: 0,
            width: 0,
            x: 0,
            y: 0,
            toJSON () {
                return {
                    bottom: 0,
                    height: 0,
                    left: 0,
                    right: 0,
                    top: 0,
                    width: 0,
                    x: 0,
                    y: 0
                };
            }
        }
    ];
    const domRectList = Object.assign(list, {
        item (index) {
            return list[index] ?? null;
        }
    });
    return domRectList;
};
function setupProseMirrorView() {
    oldElementFromPoint = Document.prototype.elementFromPoint;
    Document.prototype.elementFromPoint = mockElementFromPoint;
    oldGetClientRects = Range.prototype.getClientRects;
    Range.prototype.getClientRects = mockGetClientRects;
    oldGetBoundingClientRect = Range.prototype.getBoundingClientRect;
    Range.prototype.getBoundingClientRect = mockGetBoundingClientRect;
}
function teardownProseMirrorView() {
    // @ts-expect-error jsdom actually doesn't implement these, so they might be undefined
    Document.prototype.elementFromPoint = oldElementFromPoint;
    // @ts-expect-error jsdom actually doesn't implement these, so they might be undefined
    Range.prototype.getClientRects = oldGetClientRects;
    // @ts-expect-error jsdom actually doesn't implement these, so they might be undefined
    Range.prototype.getBoundingClientRect = oldGetBoundingClientRect;
}
