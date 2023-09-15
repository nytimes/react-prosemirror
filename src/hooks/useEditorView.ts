import type { EditorState, Transaction } from "prosemirror-state";
import { useLayoutEffect, useState } from "react";
import { unstable_batchedUpdates as batch } from "react-dom";

import { SelectionDOMObserver } from "../SelectionDOMObserver.js";
import {
  resetScrollPos,
  storeScrollPos,
} from "../prosemirror-view/domcoords.js";
import { DirectEditorProps, EditorView } from "../prosemirror-view/index.js";
import { NodeViewDesc } from "../prosemirror-view/viewdesc.js";

import { useForceUpdate } from "./useForceUpdate.js";

class ReactEditorView extends EditorView {
  init() {
    this.domObserver.start();
    this.initInput();
  }

  updateStateInner(state: EditorState, _prevProps: DirectEditorProps) {
    this.editable = !this.someProp(
      "editable",
      (value) => value(this.state) === false
    );

    const previousState = this.state;
    this.state = state;

    const scroll =
      previousState.plugins != state.plugins && !previousState.doc.eq(state.doc)
        ? "reset"
        : // @ts-expect-error scrollToSelection is internal
        state.scrollToSelection >
          // @ts-expect-error scrollToSelection is internal
          previousState.scrollToSelection
        ? "to selection"
        : "preserve";

    const updateSel = !state.selection.eq(previousState.selection);

    const oldScrollPos =
      scroll == "preserve" &&
      updateSel &&
      this.dom.style.overflowAnchor == null &&
      storeScrollPos(this);

    if (scroll == "reset") {
      this.dom.scrollTop = 0;
    } else if (scroll == "to selection") {
      this.scrollToSelection();
    } else if (oldScrollPos) {
      resetScrollPos(oldScrollPos);
    }
  }

  // @ts-expect-error We need this to be an accessor
  set docView(_) {
    // disallowed
  }

  get docView() {
    return this.dom.pmViewDesc as NodeViewDesc;
  }
}

function withBatchedUpdates<This, T extends unknown[]>(
  fn: (this: This, ...args: T) => void
): (...args: T) => void {
  return function (this: This, ...args: T) {
    batch(() => {
      fn.call(this, ...args);
    });
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
        const batchedDispatchTransaction = withBatchedUpdates(
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
  const [view, setView] = useState<EditorView | null>(null);

  const forceUpdate = useForceUpdate();

  const editorProps = withBatchedDispatch(props, forceUpdate);

  const state =
    "defaultState" in editorProps
      ? editorProps.defaultState
      : editorProps.state;

  useLayoutEffect(() => {
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
          DOMObserver: SelectionDOMObserver,
        }
      );
      setView(newView);
      return;
    }
  }, [editorProps, mount, state, view]);

  view?.setProps({
    ...editorProps,
    ...("state" in editorProps && { state: editorProps.state }),
  });

  return view;
}
