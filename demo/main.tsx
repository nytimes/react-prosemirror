import {
  baseKeymap,
  chainCommands,
  createParagraphNear,
  liftEmptyBlock,
  newlineInCode,
  splitBlock,
} from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { Schema } from "prosemirror-model";
import { liftListItem, splitListItem } from "prosemirror-schema-list";
import { EditorState, Transaction } from "prosemirror-state";
import "prosemirror-view/style/prosemirror.css";
import React, { ChangeEvent, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";

import {
  NodeViewComponentProps,
  ProseMirror,
  useEditorEventCallback,
  useNodePos,
  useNodeViews,
} from "../src/index.js";
import { ReactNodeViewConstructor } from "../src/nodeViews/createReactNodeViewConstructor.js";
import { react } from "../src/plugins/react.js";

import "./main.css";

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { group: "block", content: "inline*" },
    list: { group: "block", content: "list_item+" },
    list_item: { content: "paragraph+", toDOM: () => ["li", 0] },
    text: { group: "inline" },
    image: {
      group: "block",
      attrs: {
        src: {
          default:
            "https://static01.nyt.com/images/2023/11/16/multimedia/16uaw-gm-vcpb/16uaw-gm-vcpb-threeByTwoSmallAt2X.jpg",
        },
      },
    },
  },
});

const editorState = EditorState.create({
  doc: schema.topNodeType.create(null, [
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    schema.nodes.paragraph.createAndFill()!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    schema.nodes.list.createAndFill()!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    schema.nodes.image.createAndFill()!,
  ]),
  schema,
  plugins: [
    keymap({
      ...baseKeymap,
      Enter: chainCommands(
        newlineInCode,
        createParagraphNear,
        liftEmptyBlock,
        splitListItem(schema.nodes.list_item),
        splitBlock
      ),
      "Shift-Enter": baseKeymap.Enter,
      "Shift-Tab": liftListItem(schema.nodes.list_item),
    }),
    react(),
  ],
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

function Image({ node }: NodeViewComponentProps) {
  const pos = useNodePos();
  const imageOnChange = useEditorEventCallback<
    [ChangeEvent<HTMLInputElement>],
    void
  >((view, event) => {
    if (view) {
      view.dispatch(
        view.state.tr.setNodeAttribute(pos, "src", event.target.value)
      );
    }
  });
  return (
    <div>
      {node.attrs["src"] ? (
        <img style={{ maxWidth: "100%" }} src={node.attrs["src"]} />
      ) : null}
      {createPortal(
        <fieldset>
          <label>Edit image url:</label>&nbsp;
          <input
            type="text"
            onChange={imageOnChange}
            value={node.attrs["src"]}
          />
        </fieldset>,
        document.querySelector("#portal")!
      )}
    </div>
  );
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
  image: () => ({
    component: Image,
    dom: document.createElement("div"),
  }),
};

function DemoEditor() {
  const { nodeViews, renderNodeViews } = useNodeViews(reactNodeViews);
  const [mount, setMount] = useState<HTMLDivElement | null>(null);
  const [state, setState] = useState(editorState);

  const dispatchTransaction = useCallback(
    (tr: Transaction) => setState((oldState) => oldState.apply(tr)),
    []
  );

  return (
    <main>
      <h1>React ProseMirror Demo</h1>
      <ProseMirror
        mount={mount}
        state={state}
        nodeViews={nodeViews}
        dispatchTransaction={dispatchTransaction}
      >
        <div ref={setMount} />
        {renderNodeViews()}
      </ProseMirror>
    </main>
  );
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.getElementById("root")!);

root.render(<DemoEditor />);
