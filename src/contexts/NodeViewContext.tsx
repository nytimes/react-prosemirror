import { EditorState } from "prosemirror-state";
import { ForwardRefExoticComponent, RefAttributes, createContext } from "react";

import { NodeViewComponentProps } from "../components/NodeViewComponentProps.js";
import { ViewDesc } from "../descriptors/ViewDesc.js";
import { DOMNode } from "../prosemirror-internal/dom.js";

export type NodeViewContextValue = {
  mount: HTMLDivElement | null;
  domToDesc: Map<DOMNode, ViewDesc>;
  posToDesc: Map<number, ViewDesc>;
  nodeViews: Record<
    string,
    ForwardRefExoticComponent<
      NodeViewComponentProps & RefAttributes<HTMLElement>
    >
  >;
  state: EditorState;
};

export const NodeViewContext = createContext(
  null as unknown as NodeViewContextValue
);
