import { Node } from "prosemirror-model";
import { Mapping } from "prosemirror-transform";
import {
  Decoration,
  DecorationSet,
  DecorationSource,
  EditorView,
} from "prosemirror-view";

import {
  InternalDecoration,
  InternalDecorationSet,
  InternalDecorationSource,
} from "./internalTypes.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const none: readonly any[] = [],
  noSpec = {};

const empty = DecorationSet.empty;

// An abstraction that allows the code dealing with decorations to
// treat multiple DecorationSet objects as if it were a single object
// with (a subset of) the same interface.
class DecorationGroup implements DecorationSource {
  constructor(readonly members: readonly DecorationSet[]) {}

  map(mapping: Mapping, doc: Node) {
    const mappedDecos = this.members.map((member) =>
      member.map(mapping, doc, noSpec)
    );
    return DecorationGroup.from(mappedDecos);
  }

  forChild(offset: number, child: Node) {
    if (child.isLeaf) return DecorationSet.empty;
    let found: DecorationSet[] = [];
    for (let i = 0; i < this.members.length; i++) {
      const result = (
        this.members[i] as unknown as InternalDecorationSource
      ).forChild(offset, child);
      if (result == empty) continue;
      if (result instanceof DecorationGroup)
        found = found.concat(result.members);
      else found.push(result as unknown as DecorationSet);
    }
    return DecorationGroup.from(found);
  }

  eq(other: DecorationGroup) {
    if (
      !(other instanceof DecorationGroup) ||
      other.members.length != this.members.length
    )
      return false;
    for (let i = 0; i < this.members.length; i++)
      if (
        !(this.members[i] as unknown as InternalDecorationSource).eq(
          other.members[i] as DecorationSource
        )
      )
        return false;
    return true;
  }

  locals(node: Node) {
    let result: Decoration[] | undefined,
      sorted = true;
    for (let i = 0; i < this.members.length; i++) {
      const locals = (
        this.members[i] as unknown as InternalDecorationSet
      ).localsInner(node);
      if (!locals.length) continue;
      if (!result) {
        result = locals as Decoration[];
      } else {
        if (sorted) {
          result = result.slice();
          sorted = false;
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        for (let j = 0; j < locals.length; j++) result.push(locals[j]!);
      }
    }
    return result ? removeOverlap(sorted ? result : result.sort(byPos)) : none;
  }

  // Create a group for the given array of decoration sets, or return
  // a single set when possible.
  static from(members: readonly DecorationSource[]): DecorationSource {
    switch (members.length) {
      case 0:
        return empty;
      case 1:
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return members[0]!;
      default:
        return new DecorationGroup(
          members.every((m) => m instanceof DecorationSet)
            ? (members as DecorationSet[])
            : members.reduce(
                (r, m) =>
                  r.concat(
                    m instanceof DecorationSet
                      ? m
                      : (m as DecorationGroup).members
                  ),
                [] as DecorationSet[]
              )
        );
    }
  }
}

// Used to sort decorations so that ones with a low start position
// come first, and within a set with the same start position, those
// with an smaller end position come first.
function byPos(a: Decoration, b: Decoration) {
  return a.from - b.from || a.to - b.to;
}

// Scan a sorted array of decorations for partially overlapping spans,
// and split those so that only fully overlapping spans are left (to
// make subsequent rendering easier). Will return the input array if
// no partially overlapping spans are found (the common case).
function removeOverlap(spans: readonly Decoration[]): Decoration[] {
  let working: Decoration[] = spans as Decoration[];
  for (let i = 0; i < working.length - 1; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const span = working[i]!;
    if (span.from != span.to)
      for (let j = i + 1; j < working.length; j++) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const next = working[j]!;
        if (next.from == span.from) {
          if (next.to != span.to) {
            if (working == spans) working = spans.slice();
            // Followed by a partially overlapping larger span. Split that
            // span.
            working[j] = (next as InternalDecoration).copy(next.from, span.to);
            insertAhead(
              working,
              j + 1,
              (next as InternalDecoration).copy(span.to, next.to)
            );
          }
          continue;
        } else {
          if (next.from < span.to) {
            if (working == spans) working = spans.slice();
            // The end of this one overlaps with a subsequent span. Split
            // this one.
            working[i] = (span as InternalDecoration).copy(
              span.from,
              next.from
            );
            insertAhead(
              working,
              j,
              (span as InternalDecoration).copy(next.from, span.to)
            );
          }
          break;
        }
      }
  }
  return working;
}

function insertAhead(array: Decoration[], i: number, deco: Decoration) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  while (i < array.length && byPos(deco, array[i]!) > 0) i++;
  array.splice(i, 0, deco);
}

export function viewDecorations(
  view: EditorView,
  cursorWrapper: Decoration | null
): DecorationSource {
  const found: DecorationSource[] = [];
  view.someProp("decorations", (f) => {
    const result = f(view.state);
    if (result && result != empty) found.push(result);
  });
  // We don't have access to types for view.cursorWrapper here
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (cursorWrapper) {
    found.push(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      DecorationSet.create(view.state.doc, [cursorWrapper])
    );
  }
  return DecorationGroup.from(found);
}
