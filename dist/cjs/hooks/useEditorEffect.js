"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useEditorEffect", {
    enumerable: true,
    get: ()=>useEditorEffect
});
const _react = require("react");
const _editorContextJs = require("../contexts/EditorContext.js");
const _useLayoutGroupEffectJs = require("./useLayoutGroupEffect.js");
function useEditorEffect(effect, dependencies) {
    const { view  } = (0, _react.useContext)(_editorContextJs.EditorContext);
    // The rules of hooks want `effect` to be included in the
    // dependency list, but dependency issues for `effect` will
    // be caught by the linter at the call-site for
    // `useEditorViewLayoutEffect`.
    // Note: we specifically don't want to re-run the effect
    // every time it changes, because it will most likely
    // be defined inline and run on every re-render.
    (0, _useLayoutGroupEffectJs.useLayoutGroupEffect)(()=>{
        if (view) {
            return effect(view);
        }
    }, // The rules of hooks want to be able to statically
    // verify the dependencies for the effect, but this will
    // have already happened at the call-site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    dependencies && [
        view,
        ...dependencies
    ]);
}
