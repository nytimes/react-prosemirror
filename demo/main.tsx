import { baseKeymap, toggleMark } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { Schema } from "prosemirror-model";
import { EditorState, Plugin } from "prosemirror-state";
import "prosemirror-view/style/prosemirror.css";
import React, { ForwardedRef, Ref, forwardRef, useState } from "react";
import { createRoot } from "react-dom/client";

import {
  NodeViewComponentProps,
  ProseMirror,
  reactKeys,
  widget,
} from "../src/index.js";
import { Decoration, DecorationSet } from "../src/prosemirror-view/index.js";

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
    img: {
      group: "inline",
      inline: true,
      toDOM() {
        return [
          "img",
          {
            src: "data:image/gif;base64,R0lGODlhBQAFAIABAAAAAP///yH5BAEKAAEALAAAAAAFAAUAAAIEjI+pWAA7",
          },
        ];
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
    strong: {
      toDOM() {
        return ["strong", 0];
      },
    },
  },
});

const editorState = EditorState.create({
  schema,
  doc: schema.nodes.doc.create({}, [
    schema.nodes.paragraph.create({}, [
      schema.text("This ", [schema.marks.em.create()]),
      schema.text("is", [
        schema.marks.em.create(),
        schema.marks.strong.create(),
      ]),
      schema.nodes.img.create(),
      schema.text(" the first paragraph"),
    ]),
    schema.nodes.paragraph.create(
      {},
      schema.text("This is the second paragraph")
    ),
    schema.nodes.paragraph.create(),
    schema.nodes.paragraph.create(
      {},
      schema.text("This is the third paragraph")
    ),
  ]),
  plugins: [reactKeys()],
});

const Paragraph = forwardRef(function Paragraph(
  { children, nodeProps, ...props }: NodeViewComponentProps,
  ref: Ref<HTMLParagraphElement>
) {
  return (
    <p ref={ref} {...props}>
      {children}
    </p>
  );
});

const TestWidget = forwardRef(function TestWidget(
  props,
  ref: ForwardedRef<HTMLSpanElement>
) {
  return (
    <span
      {...props}
      ref={ref}
      style={{
        display: "inline-block",
        padding: "0.75rem 1rem",
        border: "solid thin black",
      }}
    >
      Widget
    </span>
  );
});

const viewPlugin = new Plugin({
  view(view) {
    const coords = view.coordsAtPos(view.state.selection.from);
    const dom = document.createElement("div");
    dom.style.width = "4px";
    dom.style.height = "4px";
    dom.style.position = "absolute";
    dom.style.top = `${coords.top - 2}px`;
    dom.style.left = `${coords.left - 2}px`;
    dom.style.backgroundColor = "blue";
    document.body.appendChild(dom);
    return {
      update(view) {
        const coords = view.coordsAtPos(view.state.selection.from);
        dom.style.top = `${coords.top - 2}px`;
        dom.style.left = `${coords.left - 2}px`;
      },
      destroy() {
        document.body.removeChild(dom);
      },
    };
  },
});

const plugins = [
  keymap({
    ...baseKeymap,
    "Mod-i": toggleMark(schema.marks.em),
    "Mod-b": toggleMark(schema.marks.strong),
  }),
  viewPlugin,
];

function DemoEditor() {
  const [state, setState] = useState(editorState);

  return (
    <main>
      <h1>React ProseMirror Demo</h1>
      <ProseMirror
        as={<article />}
        className="ProseMirror"
        state={state}
        dispatchTransaction={function (tr) {
          setState((prev) => prev.apply(tr));
        }}
        decorations={(state) => {
          const decorations = [
            Decoration.inline(5, 15, { class: "inline-deco" }),
          ];
          state.doc.forEach((node, offset, index) => {
            if (index === 1) {
              decorations.push(
                Decoration.node(offset, offset + node.nodeSize, {
                  nodeName: "div",
                  class: "node-deco",
                })
              );
            }
            if (index === 2) {
              decorations.push(
                Decoration.node(offset, offset + node.nodeSize, {
                  class: "node-deco",
                })
              );
            }
            if (index === 3) {
              decorations.push(
                widget(offset + node.nodeSize - 20, TestWidget, {
                  side: 0,
                  key: "widget-deco",
                })
              );
            }
          });
          return DecorationSet.create(state.doc, decorations);
        }}
        plugins={plugins}
        nodeViews={{ paragraph: Paragraph }}
      ></ProseMirror>
    </main>
  );
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.getElementById("root")!);

root.render(<DemoEditor />);

// new EditorView(
//   { mount: document.getElementById("editor")! },
//   {
//     state: EditorState.create({
//       schema,
//       plugins,
//     }),
//     dispatchTransaction(tr) {
//       this.updateState(this.state.apply(tr));
//     },
//   }
// );
