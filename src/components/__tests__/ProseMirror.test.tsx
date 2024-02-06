import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import type { Transaction } from "prosemirror-state";
import React, { useEffect, useState } from "react";

import { useNodeViews } from "../../hooks/useNodeViews.js";
import { NodeViewComponentProps } from "../../nodeViews/createReactNodeViewConstructor.js";
import { react } from "../../plugins/react.js";
import {
  setupProseMirrorView,
  teardownProseMirrorView,
} from "../../testing/setupProseMirrorView.js";
import { ProseMirror } from "../ProseMirror.js";

// Mock `ReactDOM.flushSync` to call `act` to flush updates from DOM mutations.
jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  flushSync: (fn: () => void) => act(fn),
}));

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

    const defaultState = EditorState.create({ schema });

    function TestEditor() {
      const [mount, setMount] = useState<HTMLDivElement | null>(null);

      return (
        <ProseMirror mount={mount} defaultState={defaultState}>
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

  it("supports observing transaction dispatch", async () => {
    const schema = new Schema({
      nodes: {
        text: {},
        doc: { content: "text*" },
      },
    });

    const defaultState = EditorState.create({ schema });
    const dispatchTransaction = jest.fn<void, [Transaction]>();

    function TestEditor() {
      const [mount, setMount] = useState<HTMLDivElement | null>(null);

      return (
        <ProseMirror
          mount={mount}
          defaultState={defaultState}
          dispatchTransaction={dispatchTransaction}
        >
          <div data-testid="editor" ref={setMount} />
        </ProseMirror>
      );
    }

    const user = userEvent.setup();
    render(<TestEditor />);

    const editor = screen.getByTestId("editor");
    await user.type(editor, "Hello, world!");

    expect(editor.textContent).toBe("Hello, world!");
    expect(dispatchTransaction).toHaveBeenCalledTimes(13);
  });

  it("supports controlling the editor state", async () => {
    const schema = new Schema({
      nodes: {
        text: {},
        doc: { content: "text*" },
      },
    });

    let observedState = EditorState.create({ schema });

    function TestEditor() {
      const [state, setState] = useState(observedState);
      const [mount, setMount] = useState<HTMLDivElement | null>(null);

      useEffect(() => {
        observedState = state;
      }, [state]);

      return (
        <ProseMirror
          mount={mount}
          state={state}
          dispatchTransaction={(tr) => {
            setState((s) => s.apply(tr));
          }}
        >
          <div data-testid="editor" ref={setMount} />
        </ProseMirror>
      );
    }

    const user = userEvent.setup();
    render(<TestEditor />);

    const editor = screen.getByTestId("editor");
    await user.type(editor, "Hello, world!");

    expect(observedState.doc.textContent).toBe("Hello, world!");
  });

  it("updates props atomically", async () => {
    const schema = new Schema({
      nodes: {
        text: {},
        doc: { content: "text*" },
      },
    });

    const defaultState = EditorState.create({ schema });

    let allStatesMatched = true;

    function TestEditor() {
      const [state, setState] = useState(defaultState);
      const [mount, setMount] = useState<HTMLDivElement | null>(null);

      // Check that function props get invoked with the latest React state.
      const editable = (viewState: EditorState) => {
        allStatesMatched &&= viewState === state;
        return true;
      };

      return (
        <ProseMirror
          mount={mount}
          editable={editable}
          state={state}
          dispatchTransaction={(tr) => {
            setState((s) => s.apply(tr));
          }}
        >
          <div data-testid="editor" ref={setMount} />
        </ProseMirror>
      );
    }

    const user = userEvent.setup();
    render(<TestEditor />);

    const editor = screen.getByTestId("editor");
    await user.type(editor, "Hello, world!");

    expect(allStatesMatched).toBe(true);
  });

  it("supports React NodeViews", async () => {
    const schema = new Schema({
      nodes: {
        text: {},
        paragraph: { content: "text*" },
        doc: { content: "paragraph+" },
      },
    });

    const defaultState = EditorState.create({ schema, plugins: [react()] });

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
      const [mount, setMount] = useState<HTMLDivElement | null>(null);
      const { nodeViews, renderNodeViews } = useNodeViews(reactNodeViews);

      return (
        <ProseMirror
          mount={mount}
          defaultState={defaultState}
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

  afterAll(() => {
    teardownProseMirrorView();
  });
});
