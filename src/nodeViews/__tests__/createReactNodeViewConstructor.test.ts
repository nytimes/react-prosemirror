import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";

import { ROOT_NODE_KEY, react } from "../../plugins/react.js";
import { findNodeKeyUp } from "../createReactNodeViewConstructor.js";

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { group: "block", content: "inline*" },
    text: { group: "inline" },
  },
});

function createState(): EditorState {
  return EditorState.create({
    doc: schema.nodes.doc.create(null, [schema.nodes.paragraph.create()]),
    plugins: [react()],
  });
}

/**
 * findNodeKeyUp only reads editorView.state and editorView.props.nodeViews,
 * so a minimal stub suffices and avoids needing toDOM specs for the schema.
 */
function stubView(state: EditorState): EditorView {
  return { state, props: { nodeViews: {} } } as unknown as EditorView;
}

describe("findNodeKeyUp", () => {
  it("should return ROOT_NODE_KEY for a negative position", () => {
    const view = stubView(createState());

    expect(findNodeKeyUp(view, -1)).toBe(ROOT_NODE_KEY);
  });

  it("should return ROOT_NODE_KEY for a valid position with no ancestor node views", () => {
    const view = stubView(createState());

    expect(findNodeKeyUp(view, 0)).toBe(ROOT_NODE_KEY);
  });
});
