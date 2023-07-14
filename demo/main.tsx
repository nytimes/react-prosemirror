import { baseKeymap, toggleMark } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import "prosemirror-view/style/prosemirror.css";
import React, { useState } from "react";
import { createRoot } from "react-dom/client";

import { EditorView } from "../src/components/EditorView.js";
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
    paragraph: {
      group: "block",
      content: "inline*",
      toDOM() {
        return ["p", 0];
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

// function DemoEditor() {
//   const { nodeViews, renderNodeViews } = useNodeViews(reactNodeViews);
//   const [mount, setMount] = useState<HTMLDivElement | null>(null);

//   return (
//     <main>
//       <h1>React ProseMirror Demo</h1>
//       <ProseMirror
//         mount={mount}
//         defaultState={editorState}
//         nodeViews={nodeViews}
//       >
//         <div ref={setMount} />
//         {renderNodeViews()}
//       </ProseMirror>
//     </main>
//   );
// }

function DemoEditor() {
  return (
    <main>
      <h1>React ProseMirror Demo</h1>
      <EditorView
        defaultState={editorState}
        keymap={{
          "Mod-i": toggleMark(schema.marks.em),
        }}
      ></EditorView>
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
