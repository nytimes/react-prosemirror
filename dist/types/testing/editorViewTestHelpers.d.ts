import { Node } from "prosemirror-model";
import { doc } from "prosemirror-test-builder";
import { EditorView as EditorViewT } from "prosemirror-view";
import { Props } from "../components/ProseMirror.js";
import { DOMNode } from "../dom.js";
declare module "expect" {
    interface AsymmetricMatchers {
        toEqualNode(actual: Node): void;
    }
    interface Matchers<R> {
        toEqualNode(actual: Node): R;
    }
}
export declare function tempEditor({ doc: startDoc, selection, controlled, plugins, ...props }: {
    doc?: ReturnType<typeof doc>;
    selection?: Selection;
    controlled?: boolean;
} & Omit<Props, "state">): {
    view: EditorViewT;
    rerender: (props?: Omit<Props, "state" | "plugins">) => void;
    unmount: () => void;
};
export declare function findTextNode(node: DOMNode, text: string): Text;
