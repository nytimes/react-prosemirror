import { act, render, screen } from "@testing-library/react";
import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import React, { createContext, useContext, useState } from "react";

import { ProseMirror } from "../../components/ProseMirror.js";
import type { NodeViewComponentProps } from "../../nodeViews/createReactNodeViewConstructor.js";
import { react } from "../../plugins/react.js";
import { useNodeViews } from "../useNodeViews.js";

// Mock `ReactDOM.flushSync` to call `act` to flush updates from DOM mutations.
jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  flushSync: (fn: () => void) => act(fn),
}));

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    list: { group: "block", content: "list_item+" },
    list_item: { content: "inline*" },
    text: { group: "inline" },
  },
});

const state = EditorState.create({
  doc: schema.topNodeType.create(null, schema.nodes.list.createAndFill()),
  schema,
  plugins: [react()],
});

describe("useNodeViews", () => {
  it("should render node views", () => {
    function List({ children }: NodeViewComponentProps) {
      return (
        <>
          <span contentEditable={false}>list</span>
          <ul>{children}</ul>
        </>
      );
    }

    function ListItem({ children }: NodeViewComponentProps) {
      return (
        <>
          <span contentEditable={false}>list item</span>
          <li>{children}</li>
        </>
      );
    }

    const reactNodeViews = {
      list: () => ({
        component: List,
        dom: document.createElement("div"),
        contentDOM: document.createElement("div"),
      }),
      list_item: () => ({
        component: ListItem,
        dom: document.createElement("div"),
        contentDOM: document.createElement("div"),
      }),
    };

    function TestEditor() {
      const { nodeViews, renderNodeViews } = useNodeViews(reactNodeViews);
      const [mount, setMount] = useState<HTMLDivElement | null>(null);

      return (
        <ProseMirror mount={mount} nodeViews={nodeViews} defaultState={state}>
          <div ref={setMount} />
          {renderNodeViews()}
        </ProseMirror>
      );
    }

    render(<TestEditor />);

    expect(screen.getByText("list")).toBeTruthy();
    expect(screen.getByText("list item")).toBeTruthy();
  });

  it("should render child node views as children of their parents", () => {
    const TestContext = createContext("default");

    function List({ children }: NodeViewComponentProps) {
      return (
        <TestContext.Provider value="overriden">
          <ul>{children}</ul>
        </TestContext.Provider>
      );
    }

    function ListItem({ children }: NodeViewComponentProps) {
      const testContextValue = useContext(TestContext);

      return (
        <>
          <span contentEditable={false}>{testContextValue}</span>
          <li>{children}</li>
        </>
      );
    }

    const reactNodeViews = {
      list: () => ({
        component: List,
        dom: document.createElement("div"),
        contentDOM: document.createElement("div"),
      }),
      list_item: () => ({
        component: ListItem,
        dom: document.createElement("div"),
        contentDOM: document.createElement("div"),
      }),
    };

    function TestEditor() {
      const { nodeViews, renderNodeViews } = useNodeViews(reactNodeViews);
      const [mount, setMount] = useState<HTMLDivElement | null>(null);

      return (
        <ProseMirror mount={mount} nodeViews={nodeViews} defaultState={state}>
          <div ref={setMount} />
          {renderNodeViews()}
        </ProseMirror>
      );
    }

    render(<TestEditor />);

    expect(screen.getByText("overriden")).toBeTruthy();
  });
});
