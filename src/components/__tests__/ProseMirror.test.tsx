import { act, render, screen } from "@testing-library/react";
import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import React, { forwardRef, useEffect, useState } from "react";

import { NodeViewComponentProps } from "../NodeViewComponentProps.js";
import { ProseMirror } from "../ProseMirror.js";
import { ProseMirrorDoc } from "../ProseMirrorDoc.js";

describe("ProseMirror", () => {
  it("renders a contenteditable", async () => {
    const schema = new Schema({
      nodes: {
        text: {},
        doc: { content: "text*" },
      },
    });
    const editorState = EditorState.create({ schema });

    function TestEditor() {
      return (
        <ProseMirror defaultState={editorState}>
          <ProseMirrorDoc data-testid="editor" />
        </ProseMirror>
      );
    }
    render(<TestEditor />);

    const editor = screen.getByTestId("editor");
    editor.focus();
    await browser.keys("H");
    await browser.keys("e");
    await browser.keys("l");
    await browser.keys("l");
    await browser.keys("o");
    await browser.keys(",");
    await browser.keys(" ");
    await browser.keys("w");
    await browser.keys("o");
    await browser.keys("r");
    await browser.keys("l");
    await browser.keys("d");
    await browser.keys("!");

    expect(editor.textContent).toBe("Hello, world!");
  });

  it("supports lifted editor state", async () => {
    const schema = new Schema({
      nodes: {
        text: {},
        doc: { content: "text*" },
      },
    });
    let outerEditorState = EditorState.create({ schema });
    function TestEditor() {
      const [editorState, setEditorState] = useState(outerEditorState);

      useEffect(() => {
        outerEditorState = editorState;
      }, [editorState]);

      return (
        <ProseMirror
          state={editorState}
          dispatchTransaction={(tr) =>
            act(() => setEditorState(editorState.apply(tr)))
          }
        >
          <ProseMirrorDoc data-testid="editor" />
        </ProseMirror>
      );
    }
    render(<TestEditor />);

    const editor = screen.getByTestId("editor");
    editor.focus();
    await browser.keys("H");
    await browser.keys("e");
    await browser.keys("l");
    await browser.keys("l");
    await browser.keys("o");
    await browser.keys(",");
    await browser.keys(" ");
    await browser.keys("w");
    await browser.keys("o");
    await browser.keys("r");
    await browser.keys("l");
    await browser.keys("d");
    await browser.keys("!");

    expect(outerEditorState.doc.textContent).toBe("Hello, world!");
  });

  it("supports React NodeViews", async () => {
    const schema = new Schema({
      nodes: {
        text: {},
        paragraph: {
          content: "text*",
          toDOM() {
            return ["p", 0];
          },
        },
        doc: { content: "paragraph+" },
      },
    });
    const editorState = EditorState.create({ schema });

    const Paragraph = forwardRef<HTMLDivElement | null, NodeViewComponentProps>(
      function Paragraph({ children }, ref) {
        return (
          <p ref={ref} data-testid="paragraph">
            {children}
          </p>
        );
      }
    );

    const reactNodeViews = {
      paragraph: Paragraph,
    };

    function TestEditor() {
      return (
        <ProseMirror defaultState={editorState} nodeViews={reactNodeViews}>
          <ProseMirrorDoc data-testid="editor" />
        </ProseMirror>
      );
    }
    render(<TestEditor />);

    const editor = screen.getByTestId("editor");

    editor.focus();
    await browser.keys("H");
    await browser.keys("e");
    await browser.keys("l");
    await browser.keys("l");
    await browser.keys("o");
    await browser.keys(",");
    await browser.keys(" ");
    await browser.keys("w");
    await browser.keys("o");
    await browser.keys("r");
    await browser.keys("l");
    await browser.keys("d");
    await browser.keys("!");

    expect(editor.textContent).toBe("Hello, world!");
    // Ensure that ProseMirror really rendered our Paragraph
    // component, not just any old <p> tag
    expect(screen.getAllByTestId("paragraph").length).toBeGreaterThanOrEqual(1);
  });
});
