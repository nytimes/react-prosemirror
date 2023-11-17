import { Decoration, EditorView } from "prosemirror-view";

export function computeDocDeco(view: EditorView) {
  const attrs = Object.create(null);
  attrs.class = "ProseMirror";
  attrs.contenteditable = String(view.editable);

  view.someProp("attributes", (value) => {
    if (typeof value == "function") value = value(view.state);
    if (value)
      for (const attr in value) {
        if (attr == "class") attrs.class += " " + value[attr];
        else if (attr == "style")
          attrs.style = (attrs.style ? attrs.style + ";" : "") + value[attr];
        else if (
          !attrs[attr] &&
          attr != "contenteditable" &&
          attr != "nodeName"
        )
          attrs[attr] = String(value[attr]);
      }
  });
  if (!attrs.translate) attrs.translate = "no";

  return [Decoration.node(0, view.state.doc.content.size, attrs)];
}
