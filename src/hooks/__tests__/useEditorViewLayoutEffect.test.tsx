/* eslint-disable @typescript-eslint/no-empty-function */

import { render } from "@testing-library/react";
import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import React from "react";

import { LayoutGroup } from "../../components/LayoutGroup.js";
import { EditorContext } from "../../contexts/EditorContext.js";
import {
  setupProseMirrorView,
  teardownProseMirrorView,
} from "../../testing/setupProseMirrorView.js";
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

  describe("with a real EditorView", () => {
    const schema = new Schema({
      nodes: {
        text: {},
        doc: { content: "text*" },
      },
    });

    beforeAll(() => {
      setupProseMirrorView();
    });

    afterAll(() => {
      teardownProseMirrorView();
    });

    it("should not run the effect if the EditorView has been destroyed", () => {
      const editorState = EditorState.create({ schema });
      const mount = document.createElement("div");
      document.body.appendChild(mount);
      const editorView = new EditorView({ mount }, { state: editorState });

      editorView.destroy();
      expect(editorView.isDestroyed).toBe(true);

      const effect = jest.fn();

      render(
        <LayoutGroup>
          <EditorContext.Provider
            value={{
              editorView,
              editorState,
              registerEventListener: () => {},
              unregisterEventListener: () => {},
            }}
          >
            <TestComponent effect={effect} />
          </EditorContext.Provider>
        </LayoutGroup>
      );

      expect(effect).not.toHaveBeenCalled();

      document.body.removeChild(mount);
    });

    it("should not re-run the effect after the EditorView is destroyed between renders", () => {
      const editorState = EditorState.create({ schema });
      const mount = document.createElement("div");
      document.body.appendChild(mount);
      const editorView = new EditorView({ mount }, { state: editorState });

      const effect = jest.fn();

      const { rerender } = render(
        <LayoutGroup>
          <EditorContext.Provider
            value={{
              editorView,
              editorState,
              registerEventListener: () => {},
              unregisterEventListener: () => {},
            }}
          >
            <TestComponent effect={effect} dependencies={["one"]} />
          </EditorContext.Provider>
        </LayoutGroup>
      );

      expect(effect).toHaveBeenCalledTimes(1);
      expect(effect).toHaveBeenCalledWith(editorView);

      editorView.destroy();
      expect(editorView.isDestroyed).toBe(true);

      rerender(
        <LayoutGroup>
          <EditorContext.Provider
            value={{
              editorView,
              editorState,
              registerEventListener: () => {},
              unregisterEventListener: () => {},
            }}
          >
            <TestComponent effect={effect} dependencies={["two"]} />
          </EditorContext.Provider>
        </LayoutGroup>
      );

      expect(effect).toHaveBeenCalledTimes(1);

      document.body.removeChild(mount);
    });
  });
});
