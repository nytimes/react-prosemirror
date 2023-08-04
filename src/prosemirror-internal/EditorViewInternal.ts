import { Mark } from "prosemirror-model";
import { EditorView as EditorViewT } from "prosemirror-view";

import { NodeViewDesc } from "../descriptors/ViewDesc.js";
import { DOMSelection, DOMSelectionRange } from "./dom.js";
import { InputState } from "./input.js";

export interface EditorViewInternal extends EditorViewT {
  docView: NodeViewDesc;
  domSelection: () => DOMSelection;
  focused: boolean;
  input: InputState;
  markCursor: readonly Mark[] | null;
  domSelectionRange: () => DOMSelectionRange
};
