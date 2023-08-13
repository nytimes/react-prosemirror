import { baseKeymap, toggleMark } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { Schema } from "prosemirror-model";
import { EditorState, Plugin } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import "prosemirror-view/style/prosemirror.css";
import React, {
  DetailedHTMLProps,
  ForwardedRef,
  HTMLAttributes,
  Ref,
  forwardRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";

import { EditorView } from "../src/components/EditorView.js";
import { NodeViewComponentProps } from "../src/components/NodeViewComponentProps.js";
import { widget } from "../src/decorations/ReactWidgetType.js";
import { useView } from "../src/hooks/useView.js";

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
  plugins: [keymap(baseKeymap)],
});

const Paragraph = forwardRef(function Paragraph(
  {
    children,
    className,
    pos,
  }: NodeViewComponentProps &
    DetailedHTMLProps<
      HTMLAttributes<HTMLParagraphElement>,
      HTMLParagraphElement
    >,
  ref: Ref<HTMLParagraphElement>
) {
  useView((view) => {
    // eslint-disable-next-line no-console
    // console.log(pos, view.coordsAtPos(pos));
  });
  return (
    <p ref={ref} className={className}>
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

  const decorations = [Decoration.inline(5, 15, { class: "inline-deco" })];
  state.doc.forEach((node, offset, index) => {
    if (index === 1 || index === 2) {
      decorations.push(
        Decoration.node(offset, offset + node.nodeSize, {
          nodeName: "div",
          class: "node-deco",
        })
      );
    }
    if (index === 3) {
      decorations.push(widget(offset + 10, TestWidget, { side: 0 }));
    }
  });

  return (
    <main>
      <h1>React ProseMirror Demo</h1>
      <EditorView
        className="ProseMirror"
        state={state}
        dispatchTransaction={(tr) => setState((prev) => prev.apply(tr))}
        decorations={DecorationSet.create(state.doc, decorations)}
        plugins={plugins}
        // @ts-expect-error TODO: Gotta fix these types
        nodeViews={{ paragraph: Paragraph }}
      ></EditorView>
    </main>
  );
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.getElementById("root")!);

root.render(<DemoEditor />);

// import { baseKeymap } from "prosemirror-commands";
// import { keymap } from "prosemirror-keymap";
// import { Schema } from "prosemirror-model";
// import { EditorState } from "prosemirror-state";
// import { Decoration, DecorationSet } from "prosemirror-view";
// import "prosemirror-view/style/prosemirror.css";
// import React, { useState } from "react";
// import { createRoot } from "react-dom/client";

// import {
//   NodeViewComponentProps,
//   ProseMirror,
//   useEditorEffect,
//   useEditorState,
//   useNodeViews,
// } from "../src/index.js";
// import { ReactNodeViewConstructor } from "../src/nodeViews/createReactNodeViewConstructor.js";

// import "./main.css";

// const schema = new Schema({
//   nodes: {
//     doc: { content: "block+" },
//     paragraph: {
//       group: "block",
//       content: "inline*",
//       toDOM(node) {
//         return ["p", 0];
//       },
//     },
//     text: { group: "inline" },
//   },
//   marks: {
//     em: {
//       toDOM() {
//         return ["em", 0];
//       },
//     },
//     strong: {
//       toDOM() {
//         return ["strong", 0];
//       },
//     },
//   },
// });

// const editorState = EditorState.create({
//   schema,
//   doc: schema.nodes.doc.create({}, [
//     schema.nodes.paragraph.create({}, [
//       schema.text("This ", [schema.marks.em.create()]),
//       schema.text("is", [
//         schema.marks.em.create(),
//         schema.marks.strong.create(),
//       ]),
//       schema.text(" the first paragraph"),
//     ]),
//     schema.nodes.paragraph.create(
//       {},
//       schema.text("This is the second paragraph")
//     ),
//     // schema.nodes.paragraph.create(),
//     schema.nodes.paragraph.create(
//       {},
//       schema.text("This is the third paragraph")
//     ),
//   ]),
//   plugins: [keymap(baseKeymap)],
// });

// function Paragraph({ children }: NodeViewComponentProps) {
//   return <p>{children}</p>;
// }

// const reactNodeViews: Record<string, ReactNodeViewConstructor> = {
//   paragraph: () => ({
//     component: Paragraph,
//     dom: document.createElement("div"),
//     contentDOM: document.createElement("span"),
//   }),
// };

// function DemoEditor() {
//   const { nodeViews, renderNodeViews } = useNodeViews(reactNodeViews);
//   const [mount, setMount] = useState<HTMLDivElement | null>(null);
//   const [state, setState] = useState(editorState);

//   return (
//     <main>
//       <h1>React ProseMirror Demo</h1>
//       <ProseMirror
//         mount={mount}
//         state={state}
//         dispatchTransaction={(tr) => setState((prev) => prev.apply(tr))}
//         // nodeViews={nodeViews}
//         // decorations={(s) => {
//         //   const decorations = [
//         //     Decoration.inline(5, 15, { class: "inline-deco" }),
//         //   ];
//         //   state.doc.forEach((node, offset, index) => {
//         //     if (index === 1 || index === 2) {
//         //       decorations.push(
//         //         Decoration.node(offset, offset + node.nodeSize, {
//         //           nodeName: "div",
//         //           class: "node-deco",
//         //         })
//         //       );
//         //     }
//         //     if (index === 3) {
//         //       decorations.push(
//         //         Decoration.widget(offset + 10, () => {
//         //           const el = document.createElement("div");
//         //           el.style.display = "inline-block";
//         //           el.style.padding = "0.75rem 1rem";
//         //           el.style.border = "solid thin black";
//         //           el.innerText = "Widget";
//         //           return el;
//         //         })
//         //       );
//         //     }
//         //   });
//         //   return DecorationSet.create(s.doc, decorations);
//         // }}
//       >
//         <div ref={setMount} />
//         {renderNodeViews()}
//       </ProseMirror>
//     </main>
//   );
// }

// // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
// const root = createRoot(document.getElementById("root")!);

// root.render(
//   <React.StrictMode>
//     <DemoEditor />
//   </React.StrictMode>
// );
