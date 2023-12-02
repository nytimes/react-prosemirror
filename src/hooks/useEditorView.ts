import { EditorState, Transaction } from "prosemirror-state";
import { DirectEditorProps, EditorView } from "prosemirror-view";
import { useLayoutEffect, useState } from "react";
import { unstable_batchedUpdates as batch } from "react-dom";

import { DOMNode } from "../dom.js";
import { SelectionDOMObserver } from "../selection/SelectionDOMObserver.js";
import { NodeViewDesc } from "../viewdesc.js";

import { useForceUpdate } from "./useForceUpdate.js";

// @ts-expect-error We're making use of knowledge of internal methods here
export class ReactEditorView extends EditorView {
  private shouldUpdatePluginViews = false;

  private oldProps: DirectEditorProps;

  private _props: DirectEditorProps;

  constructor(
    place:
      | null
      | DOMNode
      | ((editor: HTMLElement) => void)
      | { mount: HTMLElement },
    props: DirectEditorProps & { docView: NodeViewDesc }
  ) {
    // Call the superclass constructor with an empty
    // document and limited props. We'll set everything
    // else ourselves.
    super(place, {
      state: EditorState.create({
        schema: props.state.schema,
        plugins: props.state.plugins,
      }),
      plugins: props.plugins,
    });

    this.shouldUpdatePluginViews = true;

    this._props = props;
    this.oldProps = { state: props.state };
    this.state = props.state;

    // @ts-expect-error We're making use of knowledge of internal attributes here
    this.domObserver.stop();
    // @ts-expect-error We're making use of knowledge of internal attributes here
    this.domObserver = new SelectionDOMObserver(this);
    // @ts-expect-error We're making use of knowledge of internal attributes here
    this.domObserver.start();

    // updateCursorWrapper(this);

    // Destroy the DOM created by the default
    // ProseMirror ViewDesc implementation; we
    // have a NodeViewDesc from React instead.
    // @ts-expect-error We're making use of knowledge of internal attributes here
    this.docView.dom.replaceChildren();
    // @ts-expect-error We're making use of knowledge of internal attributes here
    this.docView = props.docView;
  }

  /**
   * Like setProps, but without executing any side effects.
   * Safe to use in a component render method.
   */
  pureSetProps(props: Partial<DirectEditorProps>) {
    // this.oldProps = this.props;
    this._props = {
      ...this._props,
      ...props,
    };
    this.state = this._props.state;
  }

  /**
   * Triggers any side effects that have been queued by previous
   * calls to pureSetProps.
   */
  runPendingEffects() {
    const newProps = this.props;
    this._props = this.oldProps;
    this.state = this._props.state;
    this.update(newProps);
  }

  update(props: DirectEditorProps) {
    super.update(props);
    // Ensure that side effects aren't re-triggered until
    // pureSetProps is called again
    this.oldProps = props;
  }

  updatePluginViews() {
    if (this.shouldUpdatePluginViews) {
      // @ts-expect-error We're making use of knowledge of internal methods here
      super.updatePluginViews();
    }
  }
}

function withFlushedUpdates<This, T extends unknown[]>(
  fn: (this: This, ...args: T) => void
): (...args: T) => void {
  return function (this: This, ...args: T) {
    batch(() => {
      fn.call(this, ...args);
    });
  };
}

function defaultDispatchTransaction(this: EditorView, tr: Transaction) {
  // HACK
  this.state = this.state.apply(tr);
}

type EditorStateProps =
  | {
      state: EditorState;
    }
  | {
      defaultState: EditorState;
    };

export type EditorProps = Omit<DirectEditorProps, "state"> &
  EditorStateProps & { docView: NodeViewDesc };

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
function withBatchedDispatch(
  props: EditorProps,
  forceUpdate: () => void
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
        const batchedDispatchTransaction = withFlushedUpdates(
          props.dispatchTransaction ?? defaultDispatchTransaction
        );
        batchedDispatchTransaction.call(this, tr);
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
  const [view, setView] = useState<ReactEditorView | null>(null);

  const forceUpdate = useForceUpdate();

  const editorProps = withBatchedDispatch(props, forceUpdate);

  const state =
    "defaultState" in editorProps
      ? editorProps.defaultState
      : editorProps.state;

  useLayoutEffect(() => {
    function onCompositionEnd() {
      forceUpdate();
    }

    if (view && view.dom !== mount) {
      setView(null);
    }

    if (!mount) {
      return;
    }

    if (!view) {
      const newView = new ReactEditorView(
        { mount },
        {
          ...editorProps,
          state,
        }
      );
      setView(newView);
      newView.dom.addEventListener("compositionend", onCompositionEnd);
      return;
    }
  }, [editorProps, forceUpdate, mount, state, view]);

  view?.pureSetProps(editorProps);

  return view as unknown as EditorView;
}
