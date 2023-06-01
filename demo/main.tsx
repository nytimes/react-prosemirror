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
  useEditorEffect,
  useEditorState,
  useNodeViews,
} from "../src/index.js";
import { ReactNodeViewConstructor } from "../src/nodeViews/createReactNodeViewConstructor.js";

import "./main.css";

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
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

const reactNodeViews: Record<string, ReactNodeViewConstructor> = {
  paragraph: () => ({
    component: Paragraph,
    dom: document.createElement("div"),
    contentDOM: document.createElement("span"),
  }),
};

function DemoEditor() {
  const { nodeViews, renderNodeViews } = useNodeViews(reactNodeViews);
  const [mount, setMount] = useState<HTMLDivElement | null>(null);

  return (
    <main>
      <h1>React ProseMirror Demo</h1>
      <ProseMirror
        mount={mount}
        defaultState={editorState}
        nodeViews={nodeViews}
      >
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
