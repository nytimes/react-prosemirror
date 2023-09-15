/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { MatcherFunction } from "expect";
import { Node } from "prosemirror-model";
import { EditorState, TextSelection } from "prosemirror-state";
import { doc, eq, schema } from "prosemirror-test-builder";
import React from "react";

import { EditorProps, ProseMirror } from "../components/ProseMirror.js";
import { useEditorEffect } from "../hooks/useEditorEffect.js";
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
  unmount: () => void;
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
    useEditorEffect((v) => {
      view = v;
    });

    return null;
  }

  const { rerender, unmount } = render(
    <ProseMirror defaultState={state} {...props}>
      <Test></Test>
    </ProseMirror>
  );

  function rerenderEditor({
    ...newProps
  }: Omit<EditorProps, "state" | "plugins">) {
    rerender(
      <ProseMirror defaultState={state} {...{ ...props, ...newProps }}>
        <Test></Test>
      </ProseMirror>
    );
  }

  return { rerender: rerenderEditor, unmount, view };
}

export async function findTextNode(_: HTMLElement, text: string) {
  const parent = await screen.findByText(text);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return parent.firstChild!;
}
