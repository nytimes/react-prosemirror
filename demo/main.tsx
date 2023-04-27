import { baseKeymap } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import "prosemirror-view/style/prosemirror.css";
import React, { useState } from "react";
import { createRoot } from "react-dom/client";

import {
  NodeViewComponentProps,
  ProseMirror,
  useNodeViews,
} from "../src/index.js";
import { ReactNodeViewConstructor } from "../src/nodeViews/createReactNodeViewConstructor.js";

import "./main.css";

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { group: "block", content: "inline*" },
    list: { group: "block", content: "list_item+" },
    list_item: { content: "inline*" },
    text: { group: "inline" },
  },
});

const editorState = EditorState.create({
  doc: schema.topNodeType.create(null, [
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    schema.nodes.paragraph.createAndFill()!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    schema.nodes.list.createAndFill()!,
  ]),
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

const reactNodeViews: Record<string, ReactNodeViewConstructor> = {
  paragraph: () => ({
    component: Paragraph,
    dom: document.createElement("div"),
    contentDOM: document.createElement("span"),
  }),
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

root.render(<DemoEditor />);
