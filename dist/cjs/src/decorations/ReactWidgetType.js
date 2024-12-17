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
    ReactWidgetType: function() {
        return ReactWidgetType;
    },
    widget: function() {
        return widget;
    }
});
const _prosemirrorview = require("prosemirror-view");
function compareObjs(a, b) {
    if (a == b) return true;
    for(const p in a)if (a[p] !== b[p]) return false;
    for(const p in b)if (!(p in a)) return false;
    return true;
}
const noSpec = {
    side: 0
};
let ReactWidgetType = class ReactWidgetType {
    Component;
    side;
    spec;
    constructor(Component, spec){
        this.Component = Component;
        this.spec = spec ?? noSpec;
        this.side = this.spec.side ?? 0;
    }
    map(mapping, span, offset, oldOffset) {
        const { pos, deleted } = mapping.mapResult(span.from + oldOffset, this.side < 0 ? -1 : 1);
        // @ts-expect-error The Decoration constructor is private/internal, but
        // we need to use it for our custom widget implementation here.
        return deleted ? null : new _prosemirrorview.Decoration(pos - offset, pos - offset, this);
    }
    valid() {
        return true;
    }
    eq(other) {
        return this == other || other instanceof ReactWidgetType && (this.spec.key && this.spec.key == other.spec.key || this.Component == other.Component && compareObjs(this.spec, other.spec));
    }
    destroy() {
    // Can be implemented with React effect hooks
    }
};
function widget(pos, component, spec) {
    // @ts-expect-error The Decoration constructor is private/internal, but
    // we need to use it for our custom widget implementation here.
    return new _prosemirrorview.Decoration(pos, pos, new ReactWidgetType(component, spec));
}
