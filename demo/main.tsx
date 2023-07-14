import { baseKeymap, toggleMark } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import "prosemirror-view/style/prosemirror.css";
import React, { Ref, forwardRef } from "react";
import { createRoot } from "react-dom/client";

import {
  EditorView,
  NodeViewComponentProps,
} from "../src/components/EditorView.js";

import "./main.css";

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: {
      group: "block",
      content: "inline*",
      toDOM() {
        return ["p", 0];
      },
    },
    list: {
      group: "block",
      content: "list_item+",
      toDOM() {
        return ["ul", 0];
      },
    },
    list_item: {
      content: "paragraph+",
      toDOM() {
        return ["li", 0];
      },
    },
    text: { group: "inline" },
  },
  marks: {
    em: {
      toDOM() {
        return ["em", 0];
      },
    },
  },
});

const editorState = EditorState.create({
  schema,
  plugins: [keymap(baseKeymap)],
});

const Paragraph = forwardRef(function Paragraph(
  { children }: NodeViewComponentProps,
  ref: Ref<HTMLParagraphElement>
) {
  return <p ref={ref}>{children}</p>;
});

function DemoEditor() {
  return (
    <main>
      <h1>React ProseMirror Demo</h1>
      <EditorView
        defaultState={editorState}
        keymap={{
          "Mod-i": toggleMark(schema.marks.em),
        }}
        nodeViews={{ paragraph: Paragraph }}
      ></EditorView>
    </main>
  );
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.getElementById("root")!);

// root.render(
//   <React.StrictMode>
//     <DemoEditor />
//   </React.StrictMode>
// );
root.render(<DemoEditor />);
