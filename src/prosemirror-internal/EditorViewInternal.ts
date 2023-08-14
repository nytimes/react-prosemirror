import { Mark } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { DirectEditorProps, EditorView as EditorViewT } from "prosemirror-view";

import { NodeViewDesc, ViewDesc } from "../descriptors/ViewDesc.js";
import { DecorationInternal } from "./DecorationInternal.js";
import { DOMNode, DOMSelection, DOMSelectionRange } from "./dom.js";
import { DOMObserver } from "./domobserver.js";
import { InputState } from "./input.js";

export interface EditorViewInternal extends EditorViewT {
  docView: NodeViewDesc;
  domSelection: () => DOMSelection;
  focused: boolean;
  input: InputState;
  markCursor: readonly Mark[] | null;
  domSelectionRange: () => DOMSelectionRange;
  domObserver: DOMObserver;
  cursorWrapper: {dom: DOMNode, deco: DecorationInternal} | null;
  lastSelectedViewDesc: ViewDesc | undefined;
  scrollToSelection(): void;
};

// export class EditorViewApi implements EditorViewApiT {
//   private _dom: DOMNode | null
//   private _props: DirectEditorProps

//   constructor(place: null | DOMNode, props: DirectEditorProps) {
//     this._dom = place
//     this._props = props
//   }

//   get dom() {
//     if (!this._dom) {
//       throw new Error(
//         "The EditorView should only be accessed in an effect or event handler."
//       );
//     }
//     return this._dom as HTMLElement;
//   }
// }
