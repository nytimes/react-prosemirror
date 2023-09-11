import { useForceUpdate } from "./useForceUpdate.js";

import type { EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import type { DirectEditorProps } from "prosemirror-view";
import { useLayoutEffect, useRef, useState } from "react";
import { unstable_batchedUpdates as batch } from "react-dom";

/**
 *
 * The view.composing state is when the compositionStart eventListener activates,
 * which creates an input method editor (IME) for foreign languages.
 * https://prosemirror.net/docs/ref/#view.EditorView.composing
 *
 * In rare exceptions, we want to dispatch transactions in non-batched form
 * when the editorView is in a composing state to maintain DOM parity.
 *
 * See React 18's documentation on opting out of automatic batching
 * https://react.dev/blog/2022/03/08/react-18-upgrade-guide#automatic-batching
 *
 * Returns a conditionally modified props.dispatchTransaction function
 */
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
 * Conditionally modifies dispatchTransaction props
 *
 * Returns modified DirectEditorProps
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
    editorPropsRef.current = withConditionalFlushDispatch(
      props,
      forceUpdate,
      view
    );
  }, [props, view, forceUpdate]);

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

  return view;
}
