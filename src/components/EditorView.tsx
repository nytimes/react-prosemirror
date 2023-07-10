import { DOMOutputSpec, Node } from "prosemirror-model";
import { EditorState, TextSelection, Transaction } from "prosemirror-state";
import { DirectEditorProps } from "prosemirror-view";
import React, {
  Children,
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

type EditorViewContextValue = {
  state: EditorState;
  domToPos: Map<HTMLElement, number>;
  posToDOM: Map<number, HTMLElement>;
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

    const props: Record<string, any> = {};
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
  const child = Children.only(children);
  if (!isValidElement(child)) return <>{child}</>;

  const clonedChild = cloneElement(child, {
    ref: (element: HTMLElement) => {
      posToDOM.set(pos, element);
      domToPos.set(element, pos);
    },
  });

  return <>{clonedChild}</>;
}

function buildReactTree(parentElement: JSX.Element, node: Node, pos: number) {
  const childElements: ReactNode[] = [];
  node.forEach((childNode, offset) => {
    if (childNode.isText) {
      childElements.push(childNode.text);
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

  const posToDOM = useRef(new Map<number, HTMLElement>());
  posToDOM.current = new Map<number, HTMLElement>();
  const domToPos = useRef(new Map<HTMLElement, number>());
  domToPos.current = new Map<HTMLElement, number>();

  const state = "state" in editorProps ? editorProps.state : internalState!;
  const dispatchTransaction = useMemo(
    () =>
      editorProps.dispatchTransaction ??
      ((tr: Transaction) =>
        setInternalState((prevState) => prevState?.apply(tr) ?? null)),
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
      while (!domToPos.current.has(anchorNode as HTMLElement))
        anchorNode = anchorNode.parentNode!;

      const anchorPos = domToPos.current.get(anchorNode as HTMLElement);
      if (!anchorPos) return;

      const $anchor = doc.resolve(anchorPos + anchorOffset);

      const { focusNode: initialHeadNode, focusOffset } = domSelection;
      if (!initialHeadNode) return;

      let headNode = initialHeadNode;
      while (!domToPos.current.has(headNode as HTMLElement))
        headNode = headNode.parentNode!;

      const headPos = domToPos.current.get(headNode as HTMLElement);
      if (!headPos) return;

      const $head = doc.resolve(headPos + focusOffset);

      const selection = TextSelection.between($anchor, $head);
      if (!state.selection.eq(selection)) {
        tr.setSelection(selection);
        dispatchTransaction(tr);
      }
    }

    mount.addEventListener("beforeinput", onBeforeInput);
    mount.addEventListener("selectionchange", onSelectionChange);

    return () => {
      mount.removeEventListener("beforeinput", onBeforeInput);
      mount.removeEventListener("selectionchange", onSelectionChange);
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
    // This is super kludgey and won't work with inline marks. What we actually want
    // is to track posToDOM for text nodes, but React doesn't have any way to ref
    // a text node!
    domSelection?.setBaseAndExtent(
      anchorNode.firstChild!,
      state.selection.anchor - anchorNodePos,
      headNode.firstChild!,
      state.selection.head - headNodePos
    );
  }, [state]);

  const content = buildReactTree(
    <div
      ref={mountRef}
      contentEditable={editable ? editable(state) : true}
    ></div>,
    state.doc,
    0
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
