import { baseKeymap } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { Fragment, Schema, Slice } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import "prosemirror-view/style/prosemirror.css";
import React, { useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import {
  NodeViewComponentProps,
  ProseMirror,
  useNodeViews,
  useProseMirrorEvent,
} from "../src";

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

const names = [
  "Shane Friedman",
  "Nozlee Samadzadeh",
  "Anna Bialas",
  "Ilya Gurevich",
  "Gabriela Contreras-Cisneros",
  "Douglas Back",
  "Alex Millatmal",
  "Elizabeth Gorence",
  "Morgan Cohn",
];

function Paragraph({ node, getPos, children }: NodeViewComponentProps) {
  const textContent = useMemo(
    () => node.textBetween(0, node.content.size, "\ufffc"),
    [node]
  );
  const lastAtIndex = useMemo(
    () => textContent.lastIndexOf("@"),
    [textContent]
  );
  const stringAfterAt =
    lastAtIndex === -1
      ? null
      : textContent.slice(lastAtIndex + 1, textContent.length + 1);

  const namesToDisplay = useMemo(() => {
    return (
      stringAfterAt &&
      names.filter((name) =>
        name.toLocaleLowerCase().startsWith(stringAfterAt.toLocaleLowerCase())
      )
    );
  }, [stringAfterAt]);

  const ref = useRef<HTMLParagraphElement | null>(null);
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  useProseMirrorEvent(
    (view, event) => {
      if (
        stringAfterAt === null ||
        namesToDisplay === null ||
        !view.state.selection.empty ||
        view.state.selection.$anchor.parent !== node
      )
        return false;
      if (event.code === "ArrowDown") {
        setHighlightIndex((previousIndex) =>
          previousIndex !== null && previousIndex < namesToDisplay.length - 1
            ? previousIndex + 1
            : 0
        );
        return true;
      }
      if (event.code === "ArrowUp") {
        setHighlightIndex((previousIndex) =>
          previousIndex !== null && previousIndex > 0
            ? previousIndex - 1
            : namesToDisplay.length - 1
        );
        return true;
      }
      if (event.code === "Enter") {
        if (highlightIndex === null) return false;
        const startIndex = getPos() + lastAtIndex + 1;
        const endIndex = getPos() + lastAtIndex + 1 + stringAfterAt.length + 1;
        view.dispatch(
          view.state.tr.replace(
            startIndex,
            endIndex,
            new Slice(
              Fragment.from(schema.text(namesToDisplay[highlightIndex])),
              0,
              0
            )
          )
        );
        return true;
      }
      return false;
    },
    [stringAfterAt, highlightIndex, namesToDisplay]
  );

  return (
    <>
      <p ref={ref}>{children}</p>
      {namesToDisplay && (
        <ul contentEditable={false}>
          {namesToDisplay.map((name, i) => (
            <li
              key={name}
              style={
                i === highlightIndex
                  ? { backgroundColor: "lightblue" }
                  : undefined
              }
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

const reactNodeViews = {
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
      <ProseMirror mount={mount} state={editorState} nodeViews={nodeViews}>
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
