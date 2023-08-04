import { baseKeymap } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import "prosemirror-view/style/prosemirror.css";
import React, {
  DetailedHTMLProps,
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
  },
});

const editorState = EditorState.create({
  schema,
  doc: schema.nodes.doc.create({}, [
    schema.nodes.paragraph.create({}, [
      schema.text("This", [schema.marks.em.create()]),
      schema.text(" is the first paragraph"),
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

function TestWidget() {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.75rem 1rem",
        border: "solid thin black",
      }}
    >
      Widget
    </span>
  );
}

function DemoEditor() {
  const [state, setState] = useState(editorState);

  const decorations = [Decoration.inline(5, 15, { class: "inline-deco" })];
  state.doc.forEach((node, offset, index) => {
    if (index === 1) {
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
        plugins={[keymap(baseKeymap)]}
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
//     paragraph: { group: "block", content: "inline*" },
//     text: { group: "inline" },
//   },
//   marks: {
//     em: {
//       toDOM() {
//         return ["em", 0];
//       },
//     },
//   },
// });

// const editorState = EditorState.create({
//   schema,
//   doc: schema.nodes.doc.create({}, [
//     schema.nodes.paragraph.create({}, [
//       schema.text("This is "),
//       schema.text("the", [schema.marks.em.create()]),
//       schema.text(" first paragraph"),
//     ]),
//     schema.nodes.paragraph.create(
//       {},
//       schema.text("This is the second paragraph")
//     ),
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

//   return (
//     <main>
//       <h1>React ProseMirror Demo</h1>
//       <ProseMirror
//         mount={mount}
//         defaultState={editorState}
//         nodeViews={nodeViews}
//         decorations={(state) =>
//           DecorationSet.create(state.doc, [
//             Decoration.inline(5, 15, { class: "inline-deco" }),
//             Decoration.node(35, 55, { class: "node-deco" }),
//             Decoration.widget(40, () => document.createElement("div")),
//           ])
//         }
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
