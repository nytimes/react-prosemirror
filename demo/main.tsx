import { baseKeymap, toggleMark } from "prosemirror-commands";
import { gapCursor } from "prosemirror-gapcursor";
import "prosemirror-gapcursor/style/gapcursor.css";
import { inputRules, wrappingInputRule } from "prosemirror-inputrules";
import { keymap } from "prosemirror-keymap";
import { Schema } from "prosemirror-model";
import { EditorState, Plugin } from "prosemirror-state";
import { columnResizing, tableEditing, tableNodes } from "prosemirror-tables";
import "prosemirror-tables/style/tables.css";
import {
  Decoration,
  DecorationSet,
  EditorView,
  NodeViewConstructor,
} from "prosemirror-view";
import "prosemirror-view/style/prosemirror.css";
import React, {
  ForwardedRef,
  Ref,
  StrictMode,
  forwardRef,
  useCallback,
  useMemo,
  useState,
} from "react";
import { createRoot } from "react-dom/client";

import {
  NodeViewComponentProps,
  ProseMirror,
  ProseMirrorDoc,
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
    ...tableNodes({
      cellContent: "inline*",
      cellAttributes: {},
      tableGroup: "block",
    }),
    footnote: {
      group: "inline",
      content: "text*",
      inline: true,
      // This makes the view treat the node as a leaf, even though it
      // technically has content
      atom: true,
      attrs: { number: { default: 0 } },
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
    image: {
      group: "block",
      toDOM() {
        return [
          "div",
          [
            "img",
            {
              src: "https://smoores.gitlab.io/storyteller/img/Storyteller_Logo.png",
              height: 150,
              width: 150,
            },
          ],
        ];
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
    schema.nodes.paragraph.create({}, [
      schema.text("This is the second paragraph"),
      schema.nodes.footnote.create({ number: 1 }, schema.text("Footnote")),
    ]),
    schema.nodes.paragraph.create(),
    schema.nodes.image.create(),
    schema.nodes.image.create(),
    schema.nodes.paragraph.create(
      {},
      schema.text("This is the third paragraph 🫵")
    ),
    schema.nodes.table.create({}, [
      schema.nodes.table_row.create({}, [
        schema.nodes.table_header.create({}, schema.text("h1")),
        schema.nodes.table_header.create({}, schema.text("h2")),
      ]),
      schema.nodes.table_row.create({}, [
        schema.nodes.table_cell.create({}, schema.text("c1")),
        schema.nodes.table_cell.create({}, schema.text("c2")),
      ]),
    ]),
  ]),
  plugins: [
    reactKeys(),
    inputRules({
      rules: [wrappingInputRule(/^\s*([-+*])\s$/, schema.nodes.list)],
    }),
    columnResizing(),
    tableEditing(),
  ],
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

const List = forwardRef(function List(
  { children, nodeProps, ...props }: NodeViewComponentProps,
  ref: Ref<HTMLUListElement>
) {
  return (
    <ul ref={ref} {...props}>
      {children}
    </ul>
  );
});

const ListItem = forwardRef(function ListItem(
  { children, nodeProps, ...props }: NodeViewComponentProps,
  ref: Ref<HTMLLIElement>
) {
  return (
    <li ref={ref} {...props}>
      {children}
    </li>
  );
});

const Footnote = forwardRef(function Footnote(
  { nodeProps, ...props }: NodeViewComponentProps,
  ref: Ref<HTMLSpanElement>
) {
  return (
    <span
      ref={ref}
      {...props}
      suppressContentEditableWarning
      contentEditable="false"
    >
      <button>{nodeProps.node.attrs.number}</button>
    </span>
  );
});

const TestWidget = forwardRef(function TestWidget(
  { widget, getPos, ...props }: WidgetViewComponentProps,
  ref: ForwardedRef<HTMLSpanElement>
) {
  return (
    <span
      {...props}
      ref={ref}
      style={{
        display: "block",
        backgroundColor: "blue",
        width: "4px",
        height: "4px",
        position: "absolute",
        transform: "translateX(-2px)",
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

// Need to handle widgets from plugins
// in ReactEditorView; current call to super
// breaks for React widgets
const widgetPlugin = new Plugin({
  props: {
    decorations(state) {
      return DecorationSet.create(state.doc, [
        widget(state.selection.from, TestWidget, {
          side: 0,
          key: "widget-plugin-widget",
        }),
      ]);
    },
  },
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
  gapCursor(),
  // widgetPlugin,
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

  const nodeViews = useMemo(
    () =>
      showReactNodeViews
        ? {
            paragraph: Paragraph,
            list: List,
            list_item: ListItem,
            footnote: Footnote,
          }
        : undefined,
    [showReactNodeViews]
  );

  const dispatchTransaction = useCallback(function (tr) {
    setState((prev) => {
      return prev.apply(tr);
    });
  }, []);

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
        key={`${showReactNodeViews}`}
        className="ProseMirror"
        state={state}
        dispatchTransaction={dispatchTransaction}
        plugins={plugins}
        nodeViews={nodeViews}
        customNodeViews={showReactNodeViews ? undefined : customNodeViews}
      >
        <ProseMirrorDoc />
      </ProseMirror>
    </main>
  );
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.getElementById("root")!);

root.render(
  <StrictMode>
    <DemoEditor />
  </StrictMode>
);
