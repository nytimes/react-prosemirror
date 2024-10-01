import { Plugin } from "prosemirror-state";
import { Decoration } from "prosemirror-view";
export declare function beforeInputPlugin(setCursorWrapper: (deco: Decoration | null) => void): Plugin<any>;
