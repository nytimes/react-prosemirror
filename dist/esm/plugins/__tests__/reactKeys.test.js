/* eslint-disable @typescript-eslint/no-non-null-assertion */ import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { reactKeys, reactKeysPluginKey } from "../reactKeys.js";
const schema = new Schema({
    nodes: {
        doc: {
            content: "block+"
        },
        paragraph: {
            group: "block",
            content: "inline*"
        },
        list: {
            group: "block",
            content: "list_item+"
        },
        list_item: {
            content: "inline*"
        },
        text: {
            group: "inline"
        }
    }
});
describe("reactNodeViewPlugin", ()=>{
    it("should create a unique key for each node", ()=>{
        const editorState = EditorState.create({
            doc: schema.topNodeType.create(null, [
                schema.nodes.paragraph.create(),
                schema.nodes.paragraph.create(),
                schema.nodes.paragraph.create()
            ]),
            plugins: [
                reactKeys()
            ]
        });
        const pluginState = reactKeysPluginKey.getState(editorState);
        expect(pluginState.posToKey.size).toBe(3);
    });
    it("should maintain key stability when possible", ()=>{
        const initialEditorState = EditorState.create({
            doc: schema.topNodeType.create(null, [
                schema.nodes.paragraph.create({}, schema.text("Hello")),
                schema.nodes.paragraph.create(),
                schema.nodes.paragraph.create()
            ]),
            plugins: [
                reactKeys()
            ]
        });
        const initialPluginState = reactKeysPluginKey.getState(initialEditorState);
        const nextEditorState = initialEditorState.apply(initialEditorState.tr.insertText(", world!", 6));
        const nextPluginState = reactKeysPluginKey.getState(nextEditorState);
        expect(Array.from(initialPluginState.keyToPos.keys())).toEqual(Array.from(nextPluginState.keyToPos.keys()));
    });
    it("should create unique keys for new nodes", ()=>{
        const initialEditorState = EditorState.create({
            doc: schema.topNodeType.create(null, [
                schema.nodes.paragraph.create(),
                schema.nodes.paragraph.create(),
                schema.nodes.paragraph.create()
            ]),
            plugins: [
                reactKeys()
            ]
        });
        const initialPluginState = reactKeysPluginKey.getState(initialEditorState);
        const nextEditorState = initialEditorState.apply(initialEditorState.tr.insert(0, schema.nodes.list.createAndFill()));
        const nextPluginState = reactKeysPluginKey.getState(nextEditorState);
        // Adds new keys for new nodes
        expect(nextPluginState.keyToPos.size).toBe(5);
        // Maintains keys for previous nodes that are still there
        Array.from(initialPluginState.keyToPos.keys()).forEach((key)=>{
            expect(Array.from(nextPluginState.keyToPos.keys())).toContain(key);
        });
    });
});
