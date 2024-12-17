import { Schema } from "prosemirror-model";
import { EditorState, Plugin, Transaction } from "prosemirror-state";
import {
  Decoration,
  DecorationSet,
  DirectEditorProps,
  EditorProps,
  EditorView,
  MarkViewConstructor,
  NodeViewConstructor,
} from "prosemirror-view";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { beforeInputPlugin } from "../plugins/beforeInputPlugin.js";
import { SelectionDOMObserver } from "../selection/SelectionDOMObserver.js";
import { setSsrStubs } from "../ssr.js";
import { NodeViewDesc } from "../viewdesc.js";

import { useComponentEventListeners } from "./useComponentEventListeners.js";
import { useForceUpdate } from "./useForceUpdate.js";

type NodeViewSet = {
  [name: string]: NodeViewConstructor | MarkViewConstructor;
};

function buildNodeViews(view: ReactEditorView) {
  const result: NodeViewSet = Object.create(null);
  function add(obj: NodeViewSet) {
    for (const prop in obj)
      if (!Object.prototype.hasOwnProperty.call(result, prop))
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        result[prop] = obj[prop]!;
  }
  view.someProp("nodeViews", add);
  view.someProp("markViews", add);
  return result;
}

function changedNodeViews(a: NodeViewSet, b: NodeViewSet) {
  let nA = 0,
    nB = 0;
  for (const prop in a) {
    if (a[prop] != b[prop]) return true;
    nA++;
  }
  for (const _ in b) nB++;
  return nA != nB;
}

function changedProps(a: DirectEditorProps, b: DirectEditorProps) {
  for (const prop of Object.keys(a) as (keyof DirectEditorProps)[]) {
    if (a[prop] !== b[prop]) return true;
  }
  return false;
}

function getEditable(view: ReactEditorView) {
  return !view.someProp("editable", (value) => value(view.state) === false);
}

// @ts-expect-error We're making use of knowledge of internal methods here
export class ReactEditorView extends EditorView {
  private shouldUpdatePluginViews = false;

  private oldProps: DirectEditorProps;

  private _props: DirectEditorProps;

  constructor(
    place: { mount: HTMLElement } | null,
    props: DirectEditorProps & { docView: NodeViewDesc }
  ) {
    // Call the superclass constructor with an empty
    // document and limited props. We'll set everything
    // else ourselves.
    const cleanup = setSsrStubs();
    super(place, {
      state: EditorState.create({
        schema: props.state.schema,
        plugins: props.state.plugins,
      }),
      plugins: props.plugins,
    });
    cleanup();

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

    this.editable = getEditable(this);

    // Destroy the DOM created by the default
    // ProseMirror ViewDesc implementation; we
    // have a NodeViewDesc from React instead.
    // @ts-expect-error We're making use of knowledge of internal attributes here
    this.docView.dom.replaceChildren();
    // @ts-expect-error We're making use of knowledge of internal attributes here
    this.docView = props.docView;
  }

  /**
   * Whether the EditorView's updateStateInner method thinks that the
   * docView needs to be blown away and redrawn.
   *
   * @privateremarks
   *
   * When ProseMirror View detects that the EditorState has been reconfigured
   * to provide new custom node views, it calls an internal function that
   * we can't override in order to recreate the entire editor DOM.
   *
   * This property mimics that check, so that we can replace the EditorView
   * with another of our own, preventing ProseMirror View from taking over
   * DOM management responsibility.
   */
  get needsRedraw() {
    if (
      this.oldProps.state.plugins === this._props.state.plugins &&
      this._props.plugins === this.oldProps.plugins
    ) {
      return false;
    }

    const newNodeViews = buildNodeViews(this);
    // @ts-expect-error Internal property
    return changedNodeViews(this.nodeViews, newNodeViews);
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

    this.editable = getEditable(this);
  }

  /**
   * Triggers any side effects that have been queued by previous
   * calls to pureSetProps.
   */
  runPendingEffects() {
    if (changedProps(this.props, this.oldProps)) {
      const newProps = this.props;
      this._props = this.oldProps;
      this.state = this._props.state;
      this.update(newProps);
    }
  }

  update(props: DirectEditorProps) {
    super.update(props);
    // Ensure that side effects aren't re-triggered until
    // pureSetProps is called again
    this.oldProps = props;
  }

  updatePluginViews(prevState?: EditorState) {
    if (this.shouldUpdatePluginViews) {
      // @ts-expect-error We're making use of knowledge of internal methods here
      super.updatePluginViews(prevState);
    }
  }

  // We want to trigger the default EditorView cleanup, but without
  // the actual view.dom cleanup (which React will have already handled).
  // So we give the EditorView a dummy DOM element and ask it to clean up
  destroy() {
    // @ts-expect-error we're intentionally overwriting this property
    // to prevent side effects
    this.dom = document.createElement("div");
    super.destroy();
  }
}

export interface UseEditorOptions extends EditorProps {
  defaultState?: EditorState;
  state?: EditorState;
  plugins?: Plugin[];
  dispatchTransaction?(this: EditorView, tr: Transaction): void;
}

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

/**
 * Creates, mounts, and manages a ProseMirror `EditorView`.
 *
 * All state and props updates are executed in a layout effect.
 * To ensure that the EditorState and EditorView are never out of
 * sync, it's important that the EditorView produced by this hook
 * is only accessed through the `useEditorViewEvent` and
 * `useEditorViewLayoutEffect` hooks.
 */
export function useEditor<T extends HTMLElement = HTMLElement>(
  mount: T | null,
  options: UseEditorOptions
) {
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
  const [cursorWrapper, _setCursorWrapper] = useState<Decoration | null>(null);
  const forceUpdate = useForceUpdate();

  const defaultState = options.defaultState ?? EMPTY_STATE;
  const [_state, setState] = useState<EditorState>(defaultState);
  const state = options.state ?? _state;

  const {
    componentEventListenersPlugin,
    registerEventListener,
    unregisterEventListener,
  } = useComponentEventListeners();

  const setCursorWrapper = useCallback((deco: Decoration | null) => {
    flushSync(() => {
      _setCursorWrapper(deco);
    });
  }, []);

  const plugins = useMemo(
    () => [
      ...(options.plugins ?? []),
      componentEventListenersPlugin,
      beforeInputPlugin(setCursorWrapper),
    ],
    [options.plugins, componentEventListenersPlugin, setCursorWrapper]
  );

  const dispatchTransaction = useCallback(
    function dispatchTransaction(this: EditorView, tr: Transaction) {
      flushSync(() => {
        if (!options.state) {
          setState((s) => s.apply(tr));
        }

        if (options.dispatchTransaction) {
          options.dispatchTransaction.call(this, tr);
        }
      });
    },
    [options.dispatchTransaction, options.state]
  );

  const cleanup = setSsrStubs();
  const tempDom = document.createElement("div");
  cleanup();

  const docViewDescRef = useRef<NodeViewDesc>(
    new NodeViewDesc(
      undefined,
      [],
      () => -1,
      state.doc,
      [],
      DecorationSet.empty,
      tempDom,
      null,
      tempDom,
      () => false,
      () => {
        /* The doc node can't have a node selection*/
      },
      () => {
        /* The doc node can't have a node selection*/
      }
    )
  );

  const directEditorProps = {
    ...options,
    state,
    plugins,
    dispatchTransaction,
    docView: docViewDescRef.current,
  };

  const [view, setView] = useState<ReactEditorView | null>(
    // During the initial render, we create something of a dummy
    // EditorView. This allows us to ensure that the first render actually
    // renders the document, which is necessary for SSR.
    () => new ReactEditorView(null, directEditorProps)
  );

  useLayoutEffect(() => {
    return () => {
      view?.destroy();
    };
  }, [view]);

  // This rule is concerned about infinite updates due to the
  // call to setView. These calls are deliberately conditional,
  // so this is not a concern.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (!mount) {
      setView(null);
      return;
    }

    if (!view || view.dom !== mount) {
      const newView = new ReactEditorView({ mount }, directEditorProps);
      setView(newView);
      newView.dom.addEventListener("compositionend", forceUpdate);
      return;
    }

    // TODO: We should be able to put this in previous branch,
    // but we need to convince EditorView's constructor not to
    // clear out the DOM when passed a mount that already has
    // content in it, otherwise React blows up when it tries
    // to clean up.
    if (view.needsRedraw) {
      setView(null);
      return;
    }

    // @ts-expect-error Internal property - domObserver
    view?.domObserver.selectionToDOM();
    view?.runPendingEffects();
  });

  view?.pureSetProps(directEditorProps);

  const editor = useMemo(
    () => ({
      view: view as EditorView | null,
      registerEventListener,
      unregisterEventListener,
      cursorWrapper,
      docViewDescRef,
    }),
    [view, registerEventListener, unregisterEventListener, cursorWrapper]
  );

  return { editor, state };
}
