import { ResolvedPos } from "prosemirror-model";
import { EditorView } from "prosemirror-view";
export declare function selectionBetween(view: EditorView, $anchor: ResolvedPos, $head: ResolvedPos, bias?: number): import("prosemirror-state").Selection;
export declare function selectionFromDOM(view: EditorView, origin?: string | null): import("prosemirror-state").Selection | null;
