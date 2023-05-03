import type { Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import type { DirectEditorProps } from "prosemirror-view";
import { useLayoutEffect, useState } from "react";
import { unstable_batchedUpdates as batch } from "react-dom";

function withBatchedUpdates<This, T extends unknown[]>(
  fn: (this: This, ...args: T) => void
): (...args: T) => void {
  return function (this: This, ...args: T) {
    batch(() => {
      fn.call(this, ...args);
    });
  };
}

const defaultDispatchTransaction = function (
  this: EditorView,
  tr: Transaction
) {
  batch(() => this.updateState(this.state.apply(tr)));
};

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
function withBatchedDispatch(props: DirectEditorProps): DirectEditorProps {
  return {
    ...props,
    ...{
      dispatchTransaction: props.dispatchTransaction
        ? withBatchedUpdates(props.dispatchTransaction)
        : defaultDispatchTransaction,
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
  props: DirectEditorProps
): EditorView | null {
  const [view, setView] = useState<EditorView | null>(null);
  // const [keyRegistry];

  props = withBatchedDispatch(props);
  const { state, ...nonStateProps } = props;

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
      setView(new EditorView({ mount }, props));
      return;
    }
  }, [mount, props, view]);

  useLayoutEffect(() => {
    view?.setProps(nonStateProps);
  }, [view, nonStateProps]);

  useLayoutEffect(() => {
    view?.setProps({ state });
  }, [view, state]);

  return view;
}
