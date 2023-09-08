/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect } from "@jest/globals";
import { render } from "@testing-library/react";
import { MatcherFunction } from "expect";
import { Node } from "prosemirror-model";
import { EditorState, TextSelection } from "prosemirror-state";
import { doc, eq, schema } from "prosemirror-test-builder";
import React from "react";

import { EditorProps, EditorView } from "../components/EditorView.js";
import { useView } from "../hooks/useView.js";
import { reactKeys } from "../plugins/reactKeys.js";
import { EditorView as EditorViewT } from "../prosemirror-view/index.js";

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
  ...props
}: { doc?: ReturnType<typeof doc>; selection?: Selection } & Omit<
  EditorProps,
  "state"
>): {
  view: EditorViewT;
  rerender: (props: Omit<EditorProps, "state" | "plugins">) => void;
} {
  startDoc = startDoc ?? doc();
  const state = EditorState.create({
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
    useView((v) => {
      view = v;
    });

    return null;
  }

  const { rerender } = render(
    <EditorView defaultState={state} {...props}>
      <Test></Test>
    </EditorView>
  );

  function rerenderEditor({
    ...newProps
  }: Omit<EditorProps, "state" | "plugins">) {
    rerender(
      <EditorView defaultState={state} {...{ ...props, ...newProps }}>
        <Test></Test>
      </EditorView>
    );
  }

  return { rerender: rerenderEditor, view };
}
