import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import type { Plugin, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import type { EditorProps } from "prosemirror-view";
import { useLayoutEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";

import type { EditorContextValue } from "../components/EditorContext.js";

import { useComponentEventListeners } from "./useComponentEventListeners.js";

const EMPTY_SCHEMA = new Schema({
  nodes: {
    doc: { content: "text*" },
    text: { inline: true },
  },
});

const EMPTY_STATE = EditorState.create({
  schema: EMPTY_SCHEMA,
});

let didWarnValueDefaultValue = false;

export interface UseEditorViewOptions extends EditorProps {
  defaultState?: EditorState;
  state?: EditorState;
  plugins?: Plugin[];
  dispatchTransaction?(this: EditorView, tr: Transaction): void;
}

/**
 * Creates, mounts, and manages a ProseMirror `EditorView`.
 *
 * All state and props updates are executed in a layout effect.
 * To ensure that the EditorState and EditorView are never out of
 * sync, it's important that the EditorView produced by this hook
 * is only accessed through the provided hooks.
 */
export function useEditorView<T extends HTMLElement = HTMLElement>(
  mount: T | null,
  options: UseEditorViewOptions
): EditorContextValue {
  if (process.env.NODE_ENV !== "production") {
    if (
      options.defaultState !== undefined &&
      options.state !== undefined &&
      !didWarnValueDefaultValue
    ) {
      console.error(
        "A component contains a ProseMirror editor with both value and defaultValue props. " +
          "ProseMirror editors must be either controlled or uncontrolled " +
          "(specify either the state prop, or the defaultState prop, but not both). " +
          "Decide between using a controlled or uncontrolled ProseMirror editor " +
          "and remove one of these props. More info: " +
          "https://reactjs.org/link/controlled-components"
      );
      didWarnValueDefaultValue = true;
    }
  }

  const defaultState = options.defaultState ?? EMPTY_STATE;
  const [_state, setState] = useState<EditorState>(defaultState);
  const state = options.state ?? _state;

  const {
    componentEventListenersPlugin,
    registerEventListener,
    unregisterEventListener,
  } = useComponentEventListeners();

  const plugins = useMemo(
    () => [...(options.plugins ?? []), componentEventListenersPlugin],
    [options.plugins, componentEventListenersPlugin]
  );

  function dispatchTransaction(this: EditorView, tr: Transaction) {
    flushSync(() => {
      if (!options.state) {
        setState((s) => s.apply(tr));
      }

      if (options.dispatchTransaction) {
        options.dispatchTransaction.call(this, tr);
      }
    });
  }

  const directEditorProps = {
    ...options,
    state,
    plugins,
    dispatchTransaction,
  };

  const [view, setView] = useState<EditorView | null>(null);

  useLayoutEffect(() => {
    return () => {
      if (view) {
        view.destroy();
      }
    };
  }, [view]);

  // This effect runs on every render and handles the view lifecycle.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (view) {
      if (view.dom === mount) {
        view.setProps(directEditorProps);
      } else {
        setView(null);
      }
    } else if (mount) {
      setView(new EditorView({ mount }, directEditorProps));
    }
  });

  return useMemo(
    () => ({
      editorState: state,
      editorView: view,
      registerEventListener,
      unregisterEventListener,
    }),
    [state, view, registerEventListener, unregisterEventListener]
  );
}
