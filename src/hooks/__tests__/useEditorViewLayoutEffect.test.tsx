import { render } from "@testing-library/react";
import type { EditorState } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import React from "react";

import { EditorViewContext } from "../../contexts/EditorViewContext.js";
import { LayoutGroup } from "../../contexts/LayoutGroup.js";
import { useEditorViewLayoutEffect } from "../useEditorViewLayoutEffect.js";

function TestComponent({
  effect,
  dependencies = [],
}: {
  effect: () => void;
  dependencies?: unknown[];
}) {
  useEditorViewLayoutEffect(effect, [effect, ...dependencies]);
  return null;
}

describe("useEditorViewLayoutEffect", () => {
  it("should run the effect", () => {
    const effect = jest.fn();
    const editorView = {} as EditorView;
    const editorState = {} as EditorState;

    render(
      <LayoutGroup>
        <EditorViewContext.Provider value={{ editorView, editorState }}>
          <TestComponent effect={effect} />
        </EditorViewContext.Provider>
      </LayoutGroup>
    );

    expect(effect).toHaveBeenCalled();
    expect(effect).toHaveBeenCalledWith(editorView);
  });

  it("should not re-run the effect if no dependencies change", () => {
    const effect = jest.fn();
    const editorView = {} as EditorView;
    const editorState = {} as EditorState;

    const { rerender } = render(
      <LayoutGroup>
        <EditorViewContext.Provider value={{ editorView, editorState }}>
          <TestComponent effect={effect} dependencies={[]} />
        </EditorViewContext.Provider>
      </LayoutGroup>
    );

    rerender(
      <LayoutGroup>
        <EditorViewContext.Provider value={{ editorView, editorState }}>
          <TestComponent effect={effect} dependencies={[]} />
        </EditorViewContext.Provider>
      </LayoutGroup>
    );

    expect(effect).toHaveBeenCalledTimes(1);
  });

  it("should re-run the effect if dependencies change", () => {
    const effect = jest.fn();
    const editorView = {} as EditorView;
    const editorState = {} as EditorState;

    const { rerender } = render(
      <LayoutGroup>
        <EditorViewContext.Provider value={{ editorView, editorState }}>
          <TestComponent effect={effect} dependencies={["one"]} />
        </EditorViewContext.Provider>
      </LayoutGroup>
    );

    rerender(
      <LayoutGroup>
        <EditorViewContext.Provider value={{ editorView, editorState }}>
          <TestComponent effect={effect} dependencies={["two"]} />
        </EditorViewContext.Provider>
      </LayoutGroup>
    );

    expect(effect).toHaveBeenCalledTimes(2);
  });
});
