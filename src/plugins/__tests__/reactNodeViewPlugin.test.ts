/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";

import { reactNodeViewPlugin } from "../reactNodeViewPlugin.js";

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { group: "block", content: "inline*" },
    list: { group: "block", content: "list_item+" },
    list_item: { content: "inline*" },
    text: { group: "inline" },
  },
});

describe("reactNodeViewPlugin", () => {
  it("should create a unique key for each node", () => {
    const editorState = EditorState.create({
      doc: schema.topNodeType.create(null, [
        schema.nodes.paragraph.create(),
        schema.nodes.paragraph.create(),
        schema.nodes.paragraph.create(),
      ]),
      plugins: [reactNodeViewPlugin],
    });

    const pluginState = reactNodeViewPlugin.getState(editorState)!;
    expect(pluginState.size).toBe(3);
  });

  it("should maintain key stability when possible", () => {
    const initialEditorState = EditorState.create({
      doc: schema.topNodeType.create(null, [
        schema.nodes.paragraph.create(),
        schema.nodes.paragraph.create(),
        schema.nodes.paragraph.create(),
      ]),
      plugins: [reactNodeViewPlugin],
    });

    const initialPluginState =
      reactNodeViewPlugin.getState(initialEditorState)!;

    const nextEditorState = initialEditorState.apply(
      initialEditorState.tr.insertText("Hello, world!", 1)
    );
    const nextPluginState = reactNodeViewPlugin.getState(nextEditorState)!;

    expect(Array.from(initialPluginState.values())).toEqual(
      Array.from(nextPluginState.values())
    );
  });

  it("should create unique keys for new nodes", () => {
    const initialEditorState = EditorState.create({
      doc: schema.topNodeType.create(null, [
        schema.nodes.paragraph.create(),
        schema.nodes.paragraph.create(),
        schema.nodes.paragraph.create(),
      ]),
      plugins: [reactNodeViewPlugin],
    });

    const initialPluginState =
      reactNodeViewPlugin.getState(initialEditorState)!;

    const nextEditorState = initialEditorState.apply(
      initialEditorState.tr.insert(0, schema.nodes.list.createAndFill()!)
    );
    const nextPluginState = reactNodeViewPlugin.getState(nextEditorState)!;

    // Adds new keys for new nodes
    expect(nextPluginState.size).toBe(5);
    // Maintains keys for previous nodes that are still there
    Array.from(initialPluginState.values()).forEach((key) => {
      expect(Array.from(nextPluginState.values())).toContain(key);
    });
  });
});
