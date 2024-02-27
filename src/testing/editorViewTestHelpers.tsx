/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect } from "@jest/globals";
import { render } from "@testing-library/react";
import { MatcherFunction } from "expect";
import { Node } from "prosemirror-model";
import { EditorState, TextSelection } from "prosemirror-state";
import { doc, eq, schema } from "prosemirror-test-builder";
import { EditorView as EditorViewT } from "prosemirror-view";
import React from "react";

import { Props, ProseMirror } from "../components/ProseMirror.js";
import { ProseMirrorDoc } from "../components/ProseMirrorDoc.js";
import { DOMNode } from "../dom.js";
import { useEditorEffect } from "../hooks/useEditorEffect.js";
import { reactKeys } from "../plugins/reactKeys.js";

const toEqualNode: MatcherFunction<[actual: unknown, expect: unknown]> =
  function (actual, expected) {
    if (!(actual instanceof Node && expected instanceof Node)) {
      throw new Error("Must be comparing nodes");
    }

    const pass = eq(actual, expected);

    return {
      message: () =>
        // `this` context will have correct typings
        `expected ${this.utils.printReceived(actual)} ${
          pass ? "not " : ""
        }to equal ${this.utils.printExpected(expected)}`,
      pass,
    };
  };

expect.extend({ toEqualNode });

declare module "expect" {
  interface AsymmetricMatchers {
    toEqualNode(actual: Node): void;
  }
  interface Matchers<R> {
    toEqualNode(actual: Node): R;
  }
}

export function tempEditor({
  doc: startDoc,
  selection,
  plugins,
  state: stateProp,
  ...props
}: { doc?: ReturnType<typeof doc>; selection?: Selection } & Omit<
  Props,
  "defaultState"
>): {
  view: EditorViewT;
  rerender: (props: Omit<Props, "plugins">) => void;
  unmount: () => void;
} {
  startDoc = startDoc ?? doc();
  const state =
    stateProp ??
    EditorState.create({
      doc: startDoc,
      schema,
      selection:
        selection ?? startDoc.tag?.a
          ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            TextSelection.create(startDoc, startDoc.tag.a!, startDoc.tag?.b)
          : undefined,
      plugins: [...(plugins ?? []), reactKeys()],
    });

  let view: any;

  function Test() {
    useEditorEffect((v) => {
      view = v;
    });

    return null;
  }

  const { rerender, unmount } = render(
    <ProseMirror
      {...(stateProp ? { state: stateProp } : { defaultState: state })}
      {...props}
    >
      <Test></Test>
      <ProseMirrorDoc />
    </ProseMirror>
  );

  function rerenderEditor({
    state: newStateProp,
    ...newProps
  }: Omit<Props, "defaultState" | "plugins">) {
    rerender(
      <ProseMirror
        {...(newStateProp && stateProp
          ? { state: newStateProp }
          : { defaultState: state })}
        {...{ ...props, ...newProps }}
      >
        <Test></Test>
        <ProseMirrorDoc />
      </ProseMirror>
    );
  }

  return { rerender: rerenderEditor, unmount, view };
}

function findTextNodeInner(node: DOMNode, text: string): Text | undefined {
  if (node.nodeType == 3) {
    if (node.nodeValue == text) return node as Text;
  } else if (node.nodeType == 1) {
    for (let ch = node.firstChild; ch; ch = ch.nextSibling) {
      const found = findTextNodeInner(ch, text);
      if (found) return found;
    }
  }
  return undefined;
}

export function findTextNode(node: DOMNode, text: string): Text {
  const found = findTextNodeInner(node, text);
  if (found) return found;

  throw new Error("Unable to find matching text node");
}
