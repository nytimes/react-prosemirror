import { Node } from "prosemirror-model";
import { Decoration, DecorationSource } from "prosemirror-view";
import { MutableRefObject } from "react";
import { NodeViewDesc, ViewDesc } from "../viewdesc.js";
export declare function useNodeViewDescriptor(node: Node | undefined, domRef: undefined | MutableRefObject<HTMLElement | null>, nodeDomRef: MutableRefObject<HTMLElement | null>, innerDecorations: DecorationSource, outerDecorations: readonly Decoration[], viewDesc?: NodeViewDesc, contentDOMRef?: MutableRefObject<HTMLElement | null>): ViewDesc[];
