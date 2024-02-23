/* eslint-disable @typescript-eslint/no-empty-function */
import { render } from "@testing-library/react";
import type { EditorState } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import React from "react";

import { LayoutGroup } from "../../components/LayoutGroup.js";
import { EditorContext } from "../../contexts/EditorContext.js";
import { useEditorEffect } from "../useEditorEffect.js";

function TestComponent({
  effect,
  dependencies = [],
}: {
  effect: () => void;
  dependencies?: unknown[];
}) {
  useEditorEffect(effect, [effect, ...dependencies]);
  return null;
}

describe("useEditorViewLayoutEffect", () => {
  it("should run the effect", () => {
    const effect = jest.fn();
    const editorView = {} as EditorView;
    const editorState = {} as EditorState;
    const registerEventListener = () => {};
    const unregisterEventListener = () => {};

    render(
      <LayoutGroup>
        <EditorContext.Provider
          value={{
            editorView,
            editorState,
            registerEventListener,
            unregisterEventListener,
          }}
        >
          <TestComponent effect={effect} />
        </EditorContext.Provider>
      </LayoutGroup>
    );

    expect(effect).toHaveBeenCalled();
    expect(effect).toHaveBeenCalledWith(editorView);
  });

  it("should not re-run the effect if no dependencies change", () => {
    const effect = jest.fn();
    const editorView = {} as EditorView;
    const editorState = {} as EditorState;
    const registerEventListener = () => {};
    const unregisterEventListener = () => {};

    const { rerender } = render(
      <LayoutGroup>
        <EditorContext.Provider
          value={{
            editorView,
            editorState,
            registerEventListener,
            unregisterEventListener,
          }}
        >
          <TestComponent effect={effect} dependencies={[]} />
        </EditorContext.Provider>
      </LayoutGroup>
    );

    rerender(
      <LayoutGroup>
        <EditorContext.Provider
          value={{
            editorView,
            editorState,
            registerEventListener,
            unregisterEventListener,
          }}
        >
          <TestComponent effect={effect} dependencies={[]} />
        </EditorContext.Provider>
      </LayoutGroup>
    );

    expect(effect).toHaveBeenCalledTimes(1);
  });

  it("should re-run the effect if dependencies change", () => {
    const effect = jest.fn();
    const editorView = {} as EditorView;
    const editorState = {} as EditorState;
    const registerEventListener = () => {};
    const unregisterEventListener = () => {};

    const { rerender } = render(
      <LayoutGroup>
        <EditorContext.Provider
          value={{
            editorView,
            editorState,
            registerEventListener,
            unregisterEventListener,
          }}
        >
          <TestComponent effect={effect} dependencies={["one"]} />
        </EditorContext.Provider>
      </LayoutGroup>
    );

    rerender(
      <LayoutGroup>
        <EditorContext.Provider
          value={{
            editorView,
            editorState,
            registerEventListener,
            unregisterEventListener,
          }}
        >
          <TestComponent effect={effect} dependencies={["two"]} />
        </EditorContext.Provider>
      </LayoutGroup>
    );

    expect(effect).toHaveBeenCalledTimes(2);
  });
});
