/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Node } from "prosemirror-model";
import { Decoration, DecorationSource } from "prosemirror-view";

import { ReactWidgetDecoration, ReactWidgetType } from "./ReactWidgetType.js";

function compareSide(a: Decoration, b: Decoration) {
  return (
    (a.type as unknown as ReactWidgetType).side -
    (b.type as unknown as ReactWidgetType).side
  );
}

// This function abstracts iterating over the nodes and decorations in
// a fragment. Calls `onNode` for each node, with its local and child
// decorations. Splits text nodes when there is a decoration starting
// or ending inside of them. Calls `onWidget` for each widget.
export function iterDeco(
  parent: Node,
  deco: DecorationSource,
  // Callbacks have been slightly modified to pass
  // the offset, so that we can pass the position as
  // a prop to components
  onWidget: (
    widget: ReactWidgetDecoration,
    offset: number,
    index: number,
    insideNode: boolean
  ) => void,
  onNode: (
    node: Node,
    outerDeco: readonly Decoration[],
    innerDeco: DecorationSource,
    offset: number,
    index: number
  ) => void
) {
  const locals = deco.locals(parent);
  let offset = 0;
  // Simple, cheap variant for when there are no local decorations
  if (locals.length == 0) {
    for (let i = 0; i < parent.childCount; i++) {
      const child = parent.child(i);
      onNode(child, locals, deco.forChild(offset, child), offset, i);
      offset += child.nodeSize;
    }
    return;
  }

  let decoIndex = 0;
  const active = [];
  let restNode = null;
  for (let parentIndex = 0; ; ) {
    if (decoIndex < locals.length && locals[decoIndex]!.to == offset) {
      const widget = locals[decoIndex++]!;
      let widgets;
      while (decoIndex < locals.length && locals[decoIndex]!.to == offset)
        (widgets || (widgets = [widget])).push(locals[decoIndex++]!);
      if (widgets) {
        widgets.sort(compareSide);
        for (let i = 0; i < widgets.length; i++)
          onWidget(
            widgets[i]! as ReactWidgetDecoration,
            offset,
            parentIndex + i,
            !!restNode
          );
      } else {
        onWidget(
          widget as ReactWidgetDecoration,
          offset,
          parentIndex,
          !!restNode
        );
      }
    }

    let child, index;
    if (restNode) {
      index = -1;
      child = restNode;
      restNode = null;
    } else if (parentIndex < parent.childCount) {
      index = parentIndex;
      child = parent.child(parentIndex++);
    } else {
      break;
    }

    for (let i = 0; i < active.length; i++)
      if (active[i]!.to <= offset) active.splice(i--, 1);
    while (
      decoIndex < locals.length &&
      locals[decoIndex]!.from <= offset &&
      locals[decoIndex]!.to > offset
    )
      active.push(locals[decoIndex++]!);

    let end = offset + child.nodeSize;
    if (child.isText) {
      let cutAt = end;
      if (decoIndex < locals.length && locals[decoIndex]!.from < cutAt)
        cutAt = locals[decoIndex]!.from;
      for (let i = 0; i < active.length; i++)
        if (active[i]!.to < cutAt) cutAt = active[i]!.to;
      if (cutAt < end) {
        restNode = child.cut(cutAt - offset);
        child = child.cut(0, cutAt - offset);
        end = cutAt;
        index = -1;
      }
    }

    const outerDeco =
      child.isInline && !child.isLeaf
        ? active.filter((d) => !d.inline)
        : active.slice();
    onNode(child, outerDeco, deco.forChild(offset, child), offset, index);
    offset = end;
  }
}
