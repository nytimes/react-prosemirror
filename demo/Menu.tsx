import React, { ReactNode } from "react";
import type { MarkType } from "prosemirror-model";
import type { EditorState, Transaction } from "prosemirror-state";
import { toggleMark } from "prosemirror-commands";

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

export default function Menu(props: {
  state: EditorState;
  dispatchTransaction: (transaction: Transaction) => void;
}) {
  const { marks } = props.state.schema;
  return (
    <div className="menu">
      <Button
        className="bold"
        isActive={isMarkActive(marks["strong"], props.state)}
        onClick={() =>
          toggleMark(marks["strong"])(props.state, props.dispatchTransaction)
        }
      >
        B
      </Button>
      <Button
        className="italic"
        isActive={isMarkActive(marks["em"], props.state)}
        onClick={() =>
          toggleMark(marks["em"])(props.state, props.dispatchTransaction)
        }
      >
        I
      </Button>
    </div>
  );
}
