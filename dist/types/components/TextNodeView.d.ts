import { Node } from "prosemirror-model";
import { Decoration, EditorView } from "prosemirror-view";
import { Component, MutableRefObject } from "react";
import { ViewDesc } from "../viewdesc.js";
type Props = {
    view: EditorView | null;
    node: Node;
    getPos: MutableRefObject<() => number>;
    siblingsRef: MutableRefObject<ViewDesc[]>;
    parentRef: MutableRefObject<ViewDesc | undefined>;
    decorations: readonly Decoration[];
};
export declare class TextNodeView extends Component<Props> {
    private viewDescRef;
    private renderRef;
    updateEffect(): void;
    shouldComponentUpdate(nextProps: Props): boolean;
    componentDidMount(): void;
    componentDidUpdate(): void;
    componentWillUnmount(): void;
    render(): JSX.Element | null;
}
export {};
