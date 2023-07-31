import { EditorView as EditorViewT } from "prosemirror-view";

import { NodeViewDesc } from "../descriptors/ViewDesc.js";
import { DOMSelection } from "./dom.js";

export type EditorViewInternal = Omit<EditorViewT, "_root"> & {
  _root: Document | ShadowRoot;
  docView: NodeViewDesc;
  domSelection: () => DOMSelection;
};
