import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import React, { useEffect, useState } from "react";

import { useNodeViews } from "../../hooks/useNodeViews.js";
import { NodeViewComponentProps } from "../../nodeViews/createReactNodeViewConstructor.js";
import {
  setupProseMirrorView,
  teardownProseMirrorView,
} from "../../testing/setupProseMirrorView.js";
import { ProseMirror } from "../ProseMirror.js";
import { simulateType } from "../utils/textKeyboardSimulator.js";

describe("ProseMirror", () => {
  beforeAll(() => {
    setupProseMirrorView();
  });

  it("renders a contenteditable", async () => {
    const schema = new Schema({
      nodes: {
        text: {},
        doc: { content: "text*" },
      },
    });
    const editorState = EditorState.create({ schema });

    function TestEditor() {
      const [mount, setMount] = useState<HTMLDivElement | null>(null);

      return (
        <ProseMirror mount={mount} state={editorState}>
          <div data-testid="editor" ref={setMount} />
        </ProseMirror>
      );
    }
    const user = userEvent.setup();
    render(<TestEditor />);

    const editor = screen.getByTestId("editor");
    await user.type(editor, "Hello, world!");

    expect(editor.textContent).toBe("Hello, world!");
  });

  it("supports lifted editor state", async () => {
    const schema = new Schema({
      nodes: {
        text: {},
        doc: { content: "text*" },
      },
    });
    let outerEditorState = EditorState.create({ schema });
    function TestEditor() {
      const [editorState, setEditorState] = useState(outerEditorState);
      const [mount, setMount] = useState<HTMLDivElement | null>(null);

      useEffect(() => {
        outerEditorState = editorState;
      }, [editorState]);

      return (
        <ProseMirror
          mount={mount}
          state={editorState}
          dispatchTransaction={(tr) =>
            act(() => setEditorState(editorState.apply(tr)))
          }
        >
          <div data-testid="editor" ref={setMount} />
        </ProseMirror>
      );
    }
    const user = userEvent.setup();
    render(<TestEditor />);

    const editor = screen.getByTestId("editor");
    await user.type(editor, "Hello, world!");

    expect(outerEditorState.doc.textContent).toBe("Hello, world!");
  });

  it("supports React NodeViews", async () => {
    const schema = new Schema({
      nodes: {
        text: {},
        paragraph: { content: "text*" },
        doc: { content: "paragraph+" },
      },
    });
    const editorState = EditorState.create({ schema });

    function Paragraph({ children }: NodeViewComponentProps) {
      return <p data-testid="paragraph">{children}</p>;
    }

    const reactNodeViews = {
      paragraph: () => ({
        component: Paragraph,
        dom: document.createElement("div"),
        contentDOM: document.createElement("span"),
      }),
    };

    function TestEditor() {
      const { nodeViews, renderNodeViews } = useNodeViews(reactNodeViews);
      const [mount, setMount] = useState<HTMLDivElement | null>(null);

      return (
        <ProseMirror
          mount={mount}
          state={editorState}
          dispatchTransaction={function (this: EditorView, tr) {
            // We have to wrap the update in `act` to handle all of
            // the async portal registering and component rendering that
            // happens "out of band" because it's triggered by ProseMirror,
            // not React.
            act(() => this.updateState(this.state.apply(tr)));
          }}
          nodeViews={nodeViews}
        >
          <div data-testid="editor" ref={setMount} />
          {renderNodeViews()}
        </ProseMirror>
      );
    }
    const user = userEvent.setup();
    render(<TestEditor />);

    const editor = screen.getByTestId("editor");

    await user.type(editor, "Hello, world!");

    expect(editor.textContent).toBe("Hello, world!");
    // Ensure that ProseMirror really rendered our Paragraph
    // component, not just any old <p> tag
    expect(screen.getAllByTestId("paragraph").length).toBeGreaterThanOrEqual(1);
  });

  it("supports composition events", async () => {
    const schema = new Schema({
      nodes: {
        text: {},
        paragraph: { content: "text*" },
        doc: { content: "paragraph+" },
      },
    });
    const editorState = EditorState.create({ schema });

    function Paragraph({ children }: NodeViewComponentProps) {
      return <p data-testid="paragraph">{children}</p>;
    }

    const reactNodeViews = {
      paragraph: () => ({
        component: Paragraph,
        dom: document.createElement("div"),
        contentDOM: document.createElement("span"),
      }),
    };

    function TestEditor() {
      const { nodeViews, renderNodeViews } = useNodeViews(reactNodeViews);
      const [mount, setMount] = useState<HTMLDivElement | null>(null);

      return (
        <ProseMirror
          mount={mount}
          state={editorState}
          dispatchTransaction={function (this: EditorView, tr) {
            // We have to wrap the update in `act` to handle all of
            // the async portal registering and component rendering that
            // happens "out of band" because it's triggered by ProseMirror,
            // not React.
            act(() => this.updateState(this.state.apply(tr)));
          }}
          nodeViews={nodeViews}
        >
          <div data-testid="editor" ref={setMount} />
          {renderNodeViews()}
        </ProseMirror>
      );
    }

    render(<TestEditor />);

    const editor = screen.getByTestId("editor");

    await editor.focus();
    simulateType("ó");

    expect(editor.textContent).toBe("ó");
    // Ensure that ProseMirror really rendered our Paragraph
    // component, not just any old <p> tag
    expect(screen.getAllByTestId("paragraph").length).toBeGreaterThanOrEqual(1);
  });
  afterAll(() => {
    teardownProseMirrorView();
  });
});
