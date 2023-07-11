import {
  chainCommands,
  deleteSelection,
  joinBackward,
  selectNodeBackward,
} from "prosemirror-commands";
import { DOMOutputSpec, Node } from "prosemirror-model";
import { EditorState, TextSelection, Transaction } from "prosemirror-state";
import { DirectEditorProps } from "prosemirror-view";
import React, {
  Children,
  Component,
  ReactElement,
  ReactNode,
  cloneElement,
  createContext,
  createElement,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { findDOMNode } from "react-dom";

type EditorViewContextValue = {
  state: EditorState;
  domToPos: Map<Element | Text, number>;
  posToDOM: Map<number, Element | Text>;
};

const EditorViewContext = createContext(
  null as unknown as EditorViewContextValue
);

type EditorStateProps =
  | {
      state: EditorState;
    }
  | {
      defaultState: EditorState;
    };

export type EditorProps = Omit<DirectEditorProps, "state"> & EditorStateProps;

export type Props = EditorProps & {
  children?: ReactNode | null;
};

function renderSpec(outputSpec: DOMOutputSpec): ReactNode {
  if (typeof outputSpec === "string") {
    return outputSpec;
  }

  if (Array.isArray(outputSpec)) {
    const tagSpec = outputSpec[0] as string;
    const tagName = tagSpec.replace(" ", ":");
    const attrs = outputSpec[1];

    const props: Record<string, unknown> = {};
    let start = 1;
    if (
      attrs &&
      typeof attrs === "object" &&
      attrs.nodeType == null &&
      !Array.isArray(attrs)
    ) {
      start = 2;
      for (const name in attrs)
        if (attrs[name] != null) {
          const attrName = name.replace(" ", ":");
          props[attrName] = attrs[name];
        }
    }
    const content: ReactNode[] = [];
    for (let i = start; i < outputSpec.length; i++) {
      const child = outputSpec[i] as DOMOutputSpec | 0;
      if (child === 0) {
        if (i < outputSpec.length - 1 || i > start) {
          throw new RangeError(
            "Content hole must be the only child of its parent node"
          );
        }
        return createElement(tagName, props, <br />);
      }
      content.push(renderSpec(child));
    }
    return createElement(tagName, props, ...content);
  }

  throw new Error(
    "@nytimes/react-prosemirror only supports strings and arrays in toDOM"
  );
}

type NodeWrapperProps = {
  children: ReactNode;
  pos: number;
};

function NodeWrapper({ children, pos }: NodeWrapperProps) {
  const { posToDOM, domToPos } = useContext(EditorViewContext);
  const ref = useRef<Element | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    posToDOM.set(pos, ref.current);
    domToPos.set(ref.current, pos);
  });

  const child = Children.only(children);
  if (!isValidElement(child)) return <>{child}</>;

  const childElement = child as ReactElement;
  const clonedChild = cloneElement(childElement, {
    ref: (element: Element) => {
      if ("ref" in childElement) {
        if (typeof childElement.ref === "function") {
          childElement.ref(element);
        } else if (
          typeof childElement.ref === "object" &&
          childElement.ref !== null &&
          "current" in childElement.ref
        ) {
          childElement.ref.current = element;
        }
      }
      ref.current = element;
    },
  });

  return <>{clonedChild}</>;
}

type TextNodeWrapperProps = {
  children: string;
  pos: number;
};

class TextNodeWrapper extends Component<TextNodeWrapperProps> {
  componentDidMount(): void {
    // There simply is no other way to ref a text node
    // eslint-disable-next-line react/no-find-dom-node
    const textNode = findDOMNode(this);
    if (!textNode) return;

    const { posToDOM, domToPos } = this.context as EditorViewContextValue;
    posToDOM.set(this.props.pos, textNode);
    domToPos.set(textNode, this.props.pos);
  }

  componentDidUpdate(): void {
    // There simply is no other way to ref a text node
    // eslint-disable-next-line react/no-find-dom-node
    const textNode = findDOMNode(this);
    if (!textNode) return;

    const { posToDOM, domToPos } = this.context as EditorViewContextValue;
    posToDOM.set(this.props.pos, textNode);
    domToPos.set(textNode, this.props.pos);
  }

  render() {
    return this.props.children;
  }
}

TextNodeWrapper.contextType = EditorViewContext;

function buildReactTree(parentElement: JSX.Element, node: Node, pos: number) {
  const childElements: ReactNode[] = [];
  node.forEach((childNode, offset) => {
    if (childNode.isText && childNode.text !== undefined) {
      childElements.push(
        <TextNodeWrapper pos={pos + offset + 1}>
          {childNode.text}
        </TextNodeWrapper>
      );
      return false;
    }

    const outputSpec = childNode.type.spec.toDOM?.(childNode);
    if (!outputSpec)
      throw new Error(`Node spec for ${childNode.type.name} is missing toDOM`);

    let element = renderSpec(outputSpec);

    if (isValidElement(element)) {
      element = buildReactTree(element, childNode, pos + offset + 1);
    }

    childElements.push(element);

    return isValidElement(element);
  });

  return (
    <NodeWrapper pos={pos}>
      {cloneElement(parentElement, undefined, ...childElements)}
    </NodeWrapper>
  );
}

export function EditorView({ children, editable, ...editorProps }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const [internalState, setInternalState] = useState<EditorState | null>(
    "defaultState" in editorProps ? editorProps.defaultState : null
  );

  const posToDOM = useRef(new Map<number, Element | Text>());
  posToDOM.current = new Map<number, Element | Text>();
  const domToPos = useRef(new Map<Element | Text, number>());
  domToPos.current = new Map<Element | Text, number>();

  // We always set internalState above if there's no state prop
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const state = "state" in editorProps ? editorProps.state : internalState!;

  const dispatchTransaction = useMemo(
    () =>
      editorProps.dispatchTransaction ??
      ((tr: Transaction) => {
        setInternalState((prevState) => prevState?.apply(tr) ?? null);
      }),
    [editorProps.dispatchTransaction]
  );

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    function onBeforeInput(event: InputEvent) {
      event.preventDefault();

      switch (event.inputType) {
        case "insertText": {
          const { tr } = state;
          if (event.data !== null) {
            tr.insertText(event.data);
            dispatchTransaction(tr);
          }
          break;
        }
        case "deleteContentBackward": {
          const deleteContentBackward = chainCommands(
            deleteSelection,
            joinBackward,
            selectNodeBackward
          );
          deleteContentBackward(state, dispatchTransaction);
          break;
        }
      }
    }

    function onSelectionChange() {
      const { doc, tr } = state;

      const domSelection = document.getSelection();
      if (!domSelection) return;

      const { anchorNode: initialAnchorNode, anchorOffset } = domSelection;
      if (!initialAnchorNode) return;

      let anchorNode = initialAnchorNode;
      while (!domToPos.current.has(anchorNode as Element)) {
        const parentNode = anchorNode.parentNode;
        if (!parentNode) return;
        anchorNode = parentNode;
      }

      const anchorPos = domToPos.current.get(anchorNode as Element);
      if (!anchorPos) return;

      const $anchor = doc.resolve(anchorPos + anchorOffset);

      const { focusNode: initialHeadNode, focusOffset } = domSelection;
      if (!initialHeadNode) return;

      let headNode = initialHeadNode;
      while (!domToPos.current.has(headNode as Element)) {
        const parentNode = headNode.parentNode;
        if (!parentNode) return;
        headNode = parentNode;
      }

      const headPos = domToPos.current.get(headNode as Element);
      if (!headPos) return;

      const $head = doc.resolve(headPos + focusOffset);

      const selection = TextSelection.between($anchor, $head);
      if (!state.selection.eq(selection)) {
        tr.setSelection(selection);
        dispatchTransaction(tr);
      }
    }

    mount.addEventListener("beforeinput", onBeforeInput);
    document.addEventListener("selectionchange", onSelectionChange);

    return () => {
      mount.removeEventListener("beforeinput", onBeforeInput);
      document.removeEventListener("selectionchange", onSelectionChange);
    };
  }, [dispatchTransaction, state]);

  useEffect(() => {
    const positions = Array.from(posToDOM.current.keys()).sort((a, b) => a - b);

    let anchorNodePos = 0;
    for (const pos of positions) {
      if (pos > state.selection.anchor) break;

      anchorNodePos = pos;
    }
    let headNodePos = 0;
    for (const pos of positions) {
      if (pos > state.selection.anchor) break;

      headNodePos = pos;
    }

    const anchorNode = posToDOM.current.get(anchorNodePos);
    const headNode = posToDOM.current.get(headNodePos);
    if (!anchorNode || !headNode) return;

    const domSelection = document.getSelection();
    domSelection?.setBaseAndExtent(
      anchorNode,
      state.selection.anchor - anchorNodePos,
      headNode,
      state.selection.head - headNodePos
    );
  }, [state]);

  const content = buildReactTree(
    <div
      ref={mountRef}
      contentEditable={editable ? editable(state) : true}
      suppressContentEditableWarning={true}
    ></div>,
    state.doc,
    -1
  );

  return (
    <EditorViewContext.Provider
      value={{
        state,
        posToDOM: posToDOM.current,
        domToPos: domToPos.current,
      }}
    >
      <>
        {content}
        {children}
      </>
    </EditorViewContext.Provider>
  );
}
