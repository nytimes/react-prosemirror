import { baseKeymap } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import "prosemirror-view/style/prosemirror.css";
import React, { ComponentType, useState } from "react";
import { createRoot } from "react-dom/client";

import {
  NodeViewComponentProps,
  ProseMirror,
  useNodeViews,
} from "../src/index.js";

import "./main.css";

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    list: { group: "block", content: "list_item+" },
    list_item: { content: "paragraph+" },
    paragraph: { group: "block", content: "inline*" },
    text: { group: "inline" },
  },
});

const editorState = EditorState.create({
  schema,
  plugins: [keymap(baseKeymap)],
});

function Paragraph({ children }: NodeViewComponentProps) {
  return <p>{children}</p>;
}

function List({ children }: NodeViewComponentProps) {
  return <ul>{children}</ul>;
}

function ListItem({ children }: NodeViewComponentProps) {
  return <li>{children}</li>;
}

const reactNodeViews: Record<string, ComponentType<NodeViewComponentProps>> = {
  paragraph: Paragraph,
  list: List,
  list_item: ListItem,
};

function DemoEditor() {
  const { nodeViews, renderNodeViews } = useNodeViews(reactNodeViews);
  const [mount, setMount] = useState<HTMLDivElement | null>(null);

  return (
    <main>
      <h1>React ProseMirror Demo</h1>
      <ProseMirror mount={mount} state={editorState} nodeViews={nodeViews}>
        <div ref={setMount} />
        {renderNodeViews()}
      </ProseMirror>
    </main>
  );
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <DemoEditor />
  </React.StrictMode>
);
