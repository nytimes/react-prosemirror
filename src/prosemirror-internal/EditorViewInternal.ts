import { EditorView as EditorViewT } from "prosemirror-view";

import { NodeViewDesc } from "../descriptors/ViewDesc.js";
import { DOMSelection } from "./dom.js";

export interface EditorViewInternal extends EditorViewT {
  docView: NodeViewDesc;
  domSelection: () => DOMSelection;
};
