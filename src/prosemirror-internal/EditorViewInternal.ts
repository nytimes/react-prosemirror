import { Mark } from "prosemirror-model";
import { EditorView as EditorViewT } from "prosemirror-view";

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
