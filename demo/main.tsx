import { baseKeymap } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import "prosemirror-view/style/prosemirror.css";
import React, { createContext, useContext, useState } from "react";
import { createRoot } from "react-dom/client";

import { NodeViewComponentProps, ProseMirror, useEditorEffect } from "../src";

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

const ThemeContext = createContext("light");

function Paragraph({ children }: NodeViewComponentProps) {
  const theme = useContext(ThemeContext);
  // Don't really want this in the demo, just showing that it works!
  useEditorEffect((view) => {
    console.log(view?.coordsAtPos(view?.state.selection.anchor));
  });
  return <p className={theme}>{children}</p>;
}

const reactNodeViews = {
  paragraph: {
    component: Paragraph,
    contentTag: "span" as const,
  },
};

function DemoEditor() {
  const [mount, setMount] = useState<HTMLDivElement | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  return (
    <ThemeContext.Provider value={theme}>
      <main>
        <button
          type="button"
          onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
        >
          Toggle theme
        </button>
        <h1>React-ProseMirror Demo</h1>
        <ProseMirror
          mount={mount}
          state={editorState}
          reactNodeViews={reactNodeViews}
          contexts={[ThemeContext]}
        >
          <div ref={setMount} className={theme} />
        </ProseMirror>
      </main>
    </ThemeContext.Provider>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <DemoEditor />
  </React.StrictMode>
);
