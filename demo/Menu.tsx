import { toggleMark } from "prosemirror-commands";
import type { MarkType } from "prosemirror-model";
import type { EditorState, Transaction } from "prosemirror-state";
import React, { ReactNode } from "react";

import { useEditorEventCallback, useEditorState } from "../src/index.js";

function isMarkActive(mark: MarkType, state: EditorState): boolean {
  if (!state.selection) return false;
  const { from, $from, to, empty } = state.selection;
  return empty
    ? !!mark.isInSet(state.storedMarks || $from.marks())
    : state.doc.rangeHasMark(from, to, mark);
}

export function Button(props: {
  children?: ReactNode;
  isActive: boolean;
  className?: string;
  onClick: () => void;
}) {
  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    props.onClick();
  }
  return (
    <button
      className={`button ${props.className} ${props.isActive ? "active" : ""}`}
      onMouseDown={handleMouseDown}
    >
      {props.children}
    </button>
  );
}

export default function Menu() {
  const state = useEditorState();
  const { marks } = state.schema;

  const toggleBold = useEditorEventCallback((view) => {
    if (!view) return;
    const toggleBoldMark = toggleMark(marks["bold"]);
    toggleBoldMark(view.state, view.dispatch, view);
  });

  const toggleItalic = useEditorEventCallback((view) => {
    if (!view) return;
    const toggleBoldMark = toggleMark(marks["em"]);
    toggleBoldMark(view.state, view.dispatch, view);
  });

  return (
    <div className="menu">
      <Button
        className="bold"
        isActive={isMarkActive(marks["strong"], state)}
        onClick={toggleBold}
      >
        B
      </Button>
      <Button
        className="italic"
        isActive={isMarkActive(marks["em"], state)}
        onClick={toggleItalic}
      >
        I
      </Button>
    </div>
  );
}
