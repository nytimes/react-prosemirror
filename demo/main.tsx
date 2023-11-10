import { baseKeymap, toggleMark } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { Schema } from "prosemirror-model";
import { EditorState, Plugin } from "prosemirror-state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  NodeViewConstructor,
} from "prosemirror-view";
import "prosemirror-view/style/prosemirror.css";
import React, { ForwardedRef, Ref, forwardRef, useState } from "react";
import { createRoot } from "react-dom/client";

import {
  NodeViewComponentProps,
  ProseMirror,
  WidgetViewComponentProps,
  reactKeys,
  widget,
} from "../src/index.js";

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
      attrs: {
        src: { default: "" },
      },
      toDOM(node) {
        return [
          "img",
          {
            src: node.attrs.src,
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
      schema.nodes.img.create({
        src: "data:image/gif;base64,R0lGODlhBQAFAIABAAAAAP///yH5BAEKAAEALAAAAAAFAAUAAAIEjI+pWAA7",
      }),
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
  { widget, pos, ...props }: WidgetViewComponentProps,
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

const customNodeViews: Record<string, NodeViewConstructor> = {
  paragraph: () => {
    const dom = document.createElement("p");
    return {
      dom,
      contentDOM: dom,
    };
  },
};

function DemoEditor() {
  const [state, setState] = useState(editorState);
  const [showReactNodeViews, setShowReactNodeViews] = useState(true);

  return (
    <main>
      <h1>React ProseMirror Demo</h1>
      <button
        onClick={() => {
          if (showReactNodeViews) {
            setShowReactNodeViews((prev) => !prev);
          } else {
            window.location.reload();
          }
        }}
      >
        Switch to{" "}
        {showReactNodeViews
          ? "ProseMirror node views"
          : "React node views (requires reload)"}
      </button>
      <ProseMirror
        as={<article />}
        key={`${showReactNodeViews}`}
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
        nodeViews={showReactNodeViews ? { paragraph: Paragraph } : undefined}
        customNodeViews={showReactNodeViews ? undefined : customNodeViews}
      />
    </main>
  );
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.getElementById("root")!);

root.render(<DemoEditor />);

// new EditorView(
//   { mount: document.getElementById("editor")! },
//   {
//     state: editorState,
//     plugins,
//     decorations(state) {
//       const decorations = [Decoration.inline(5, 15, { class: "inline-deco" })];
//       state.doc.forEach((node, offset, index) => {
//         if (index === 1) {
//           decorations.push(
//             Decoration.node(offset, offset + node.nodeSize, {
//               nodeName: "div",
//               class: "node-deco",
//             })
//           );
//         }
//         if (index === 2) {
//           decorations.push(
//             Decoration.node(offset, offset + node.nodeSize, {
//               class: "node-deco",
//             })
//           );
//         }
//         if (index === 2) {
//           decorations.push(
//             Decoration.widget(
//               offset + 1,
//               () => {
//                 const span = document.createElement("span");
//                 span.appendChild(document.createTextNode("Widget"));
//                 span.style.display = "inline-block";
//                 span.style.padding = "0.75rem 1rem";
//                 span.style.border = "solid thin black";
//                 return span;
//               },
//               {
//                 side: 0,
//                 key: "widget-deco",
//               }
//             )
//           );
//         }
//       });
//       return DecorationSet.create(state.doc, decorations);
//     },
//     nodeViews: {
//       img: (node, _editorView, getPos) => {
//         const img = document.createElement("img");
//         img.src = node.attrs.src;
//         const span = document.createElement("span");
//         span.appendChild(document.createTextNode(`pos: ${getPos()}`));
//         span.appendChild(img);
//         const dom = document.createElement("div");
//         dom.style["display"] = "contents";
//         dom.appendChild(span);
//         return {
//           dom,
//           update(node) {
//             const newText = document.createTextNode(`pos: ${getPos()}`);
//             span.replaceChildren(newText, img);
//             img.src = node.attrs.src;
//             return true;
//           },
//           destroy() {
//             dom.remove();
//           },
//         };
//       },
//     },
//     dispatchTransaction(tr) {
//       this.updateState(this.state.apply(tr));
//     },
//   }
// );
