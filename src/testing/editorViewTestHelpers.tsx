/* eslint-disable @typescript-eslint/no-explicit-any */
import { render } from "@testing-library/react";
import { MatcherFunction, expect } from "expect";
import { Node } from "prosemirror-model";
import { EditorState, TextSelection } from "prosemirror-state";
import { doc, eq, p, schema } from "prosemirror-test-builder";
import { EditorView, EditorView as EditorViewT } from "prosemirror-view";
import React from "react";

import { Props, ProseMirror } from "../components/ProseMirror.js";
import { ProseMirrorDoc } from "../components/ProseMirrorDoc.js";
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
  controlled,
  plugins,
  ...props
}: {
  doc?: ReturnType<typeof doc>;
  selection?: Selection;
  controlled?: boolean;
} & Omit<Props, "state">): {
  view: EditorViewT;
  rerender: (props: Omit<Props, "state" | "plugins">) => void;
} {
  startDoc = startDoc ?? doc(p());
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

  let view: EditorView | null = null;

  // return new Promise((resolve) => {
  function Test() {
    useEditorEffect((v) => {
      view = v;
      // resolve({ view, rerender: rerenderEditor });
    }, []);

    return null;
  }

  const { rerender } = render(
    <ProseMirror
      {...(controlled ? { state } : { defaultState: state })}
      {...props}
    >
      <Test></Test>
      <ProseMirrorDoc />
    </ProseMirror>
  );

  function rerenderEditor({ ...newProps }: Omit<Props, "state" | "plugins">) {
    rerender(
      <ProseMirror
        {...(controlled ? { state } : { defaultState: state })}
        {...{ ...props, ...newProps }}
      >
        <Test></Test>
        <ProseMirrorDoc />
      </ProseMirror>
    );
  }

  return { view: view as unknown as EditorView, rerender: rerenderEditor };
  // });
}
