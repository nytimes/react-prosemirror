import { useForceUpdate } from "./useForceUpdate.js";

import type { EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import type { DirectEditorProps } from "prosemirror-view";
import { useLayoutEffect, useRef, useState } from "react";
import { unstable_batchedUpdates as batch } from "react-dom";

function withConditionalFlushUpdates<This, T extends unknown[]>(
  fn: (this: This, ...args: T) => void,
  view: EditorView | null
): (...args: T) => void {
  return function (this: This, ...args: T) {
    if (view?.composing) {
      batch(() => {
        fn.call(this, ...args);
      });
    } else {
      fn.call(this, ...args);
    }
  };
}

function defaultDispatchTransaction(this: EditorView, tr: Transaction) {
  this.updateState(this.state.apply(tr));
}

type EditorStateProps =
  | {
      state: EditorState;
    }
  | {
      defaultState: EditorState;
    };

export type EditorProps = Omit<DirectEditorProps, "state"> & EditorStateProps;

/**
 * Enhances editor props so transactions dispatch in a batched update.
 *
 * It is important that changes to the editor get batched by React so that any
 * components that dispatch transactions in effects do so after rendering with
 * state changes from any previous transaction, so that they may use the latest
 * state and not trigger nested transactions.
 *
 * TODO(OK-4006): We can remove this helper and pass the direct editor props to
 * the Editor View unmodified after we upgrade to React 18, which batches every
 * update by default.
 */
function withConditionalFlushDispatch(
  props: EditorProps,
  forceUpdate: () => void,
  view: EditorView | null
): EditorProps & {
  dispatchTransaction: EditorView["dispatch"];
} {
  return {
    ...props,
    ...{
      dispatchTransaction: function dispatchTransaction(
        this: EditorView,
        tr: Transaction
      ) {
        const conditionallyFlushedDispatch = withConditionalFlushUpdates(
          props.dispatchTransaction ?? defaultDispatchTransaction,
          view
        );
        conditionallyFlushedDispatch.call(this, tr);
        forceUpdate();
      },
    },
  };
}

/**
 * Creates, mounts, and manages a ProseMirror `EditorView`.
 *
 * All state and props updates are executed in a layout effect.
 * To ensure that the EditorState and EditorView are never out of
 * sync, it's important that the EditorView produced by this hook
 * is only accessed through the `useEditorViewEvent` and
 * `useEditorViewLayoutEffect` hooks.
 */
export function useEditorView<T extends HTMLElement = HTMLElement>(
  mount: T | null,
  props: EditorProps
): EditorView | null {
  const [view, setView] = useState<EditorView | null>(null);
  const editorPropsRef = useRef(props);

  const forceUpdate = useForceUpdate();

  const stateProp =
    "state" in editorPropsRef.current
      ? editorPropsRef.current.state
      : undefined;

  const state =
    "defaultState" in editorPropsRef.current
      ? editorPropsRef.current.defaultState
      : editorPropsRef.current.state;

  const nonStateProps = Object.fromEntries(
    Object.entries(editorPropsRef.current).filter(
      ([propName]) => propName !== "state" && propName !== "defaultState"
    )
  );

  useLayoutEffect(() => {
    return () => {
      if (view) {
        view.destroy();
      }
    };
  }, [view]);

  useLayoutEffect(() => {
    if (view && view.dom !== mount) {
      setView(null);
      return;
    }

    if (!mount) {
      return;
    }

    if (!view) {
      setView(
        new EditorView(
          { mount },
          {
            ...editorPropsRef.current,
            state,
          }
        )
      );
      return;
    }
  }, [props, mount, state, view]);

  useLayoutEffect(() => {
    view?.setProps(nonStateProps);
  }, [view, nonStateProps]);

  useLayoutEffect(() => {
    if (stateProp) view?.setProps({ state: stateProp });
  }, [view, stateProp]);

  useLayoutEffect(() => {
    editorPropsRef.current = withConditionalFlushDispatch(
      props,
      forceUpdate,
      view
    );
  }, [props, view, forceUpdate]);

  return view;
}
