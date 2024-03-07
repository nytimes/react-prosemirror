import { Node } from "prosemirror-model";
import { Decoration, EditorView } from "prosemirror-view";
import { Component } from "react";
import { ViewDesc } from "../viewdesc.js";
type Props = {
    view: EditorView | null;
    node: Node;
    pos: number;
    siblingDescriptors: ViewDesc[];
    decorations: readonly Decoration[];
};
export declare class TextNodeView extends Component<Props> {
    private viewDescRef;
    updateEffect(): void;
    componentDidMount(): void;
    componentDidUpdate(): void;
    render(): JSX.Element;
}
export {};
