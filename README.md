# React ProseMirror

<p align="center">
  <img src="https://github.com/nytimes/react-prosemirror/raw/main/react-prosemirror-logo.png" alt="React ProseMirror Logo" width="120px" height="120px"/>
  <br>
  <em>A fully featured library for safely integrating ProseMirror and React.</em>
  <br>
</p>

[![Join the chat at https://gitter.im/nytimes/react-prosemirror](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/nytimes/react-prosemirror?utm_source=badge&utm_medium=badge&utm_content=badge)

## Active development has moved to `@handlewithcare/react-prosemirror`

As of Jan. 17, 2025, active development on the v2 release of this library
(a.k.a. the `react-editor-view` branch) has moved to the
[handlewithcarecollective/react-prosemirror](https://github.com/handlewithcarecollective/react-prosemirror)
repository, and has been published under the
[`@handlewithcare/react-prosemirror`](https://npmjs.com/package/@handlewithcare/react-prosemirror)
NPM package.

Bug fixes and patches may still be applied to the `1.x` branch in this
repository and published to `@nytimes/react-prosemirror`.

Our intent had been to focus on the upcoming v2 release, previously the
`react-editor-view` branch, in the `main` branch of this repo. Instead, we've
decided to fork that version into its own repository and NPM package.

To try out the new version, install `@handlewithcare/react-prosemirror`. We'd
love to hear your thoughts!

## Installation

npm:

```sh
npm install @nytimes/react-prosemirror
```

yarn:

```sh
yarn add @nytimes/react-prosemirror
```

<!-- toc -->

- [The Problem](#the-problem)
- [The Solution](#the-solution)
  - [Rendering ProseMirror Views within React](#rendering-prosemirror-views-within-react)
    - [`useEditorEffect`](#useeditoreffect)
    - [`useEditorEventCallback`](#useeditoreventcallback)
    - [`useEditorEventListener`](#useeditoreventlistener)
  - [Building node views with React](#building-node-views-with-react)
- [API](#api)
  - [`ProseMirror`](#prosemirror)
  - [`react`](#react)
  - [`useEditorState`](#useeditorstate)
  - [`useEditorEventCallback`](#useeditoreventcallback-1)
  - [`useEditorEventListener`](#useeditoreventlistener-1)
  - [`useEditorEffect`](#useeditoreffect-1)
  - [`useNodePos`](#usenodepos)

<!-- tocstop -->

## The Problem

React is a framework for developing reactive user interfaces. To make updates
efficient, React separates updates into phases so that it can process updates in
batches. In the first phase, application code renders a virtual document. In the
second phase, the React DOM renderer finalizes the update by reconciling the
real document with the virtual document. The ProseMirror View library renders
ProseMirror documents in a single-phase update. Unlike React, it also allows
built-in editing features of the browser to modify the document under some
circumstances, deriving state updates from view updates rather than the other
way around.

It is possible to use both React DOM and ProseMirror View, but using React DOM
to render ProseMirror View components safely requires careful consideration of
differences between the rendering approaches taken by each framework. The first
phase of a React update should be free of side effects, which requires that
updates to the ProseMirror View happen in the second phase. This means that
during the first phase, React components actually have access to a different
(newer) version of the EditorState than the one in the Editorview. As a result
code that dispatches transactions may dispatch transactions based on incorrect
state. Code that invokes methods of the ProseMirror view may make bad
assumptions about its state that cause incorrect behavior or errors.

## The Solution

There are two different directions to integrate ProseMirror and React: you can
render a ProseMirror EditorView inside of a React component, and you can use
React components to render ProseMirror NodeViews. This library provides tools
for accomplishing both of these goals.

### Rendering ProseMirror Views within React

This library provides a set of React contexts and hooks for consuming them that
ensure safe access to the EditorView from React components. This allows us to
build React applications that contain ProseMirror Views, even when the
EditorState is lifted into React state, or a global state management system like
Redux.

The simplest way to make use of these contexts is with the `<ProseMirror/>`
component. The `<ProseMirror/>` component can be used controlled or
uncontrolled, and takes a "mount" prop, used to specify which DOM node the
ProseMirror EditorView should be mounted on.

```tsx
import { EditorState } from "prosemirror-state";
import { schema } from "prosemirror-schema-basic";
import { ProseMirror } from "@nytimes/react-prosemirror";

const defaultState = EditorState.create({ schema });
export function ProseMirrorEditor() {
  // It's important that mount is stored as state,
  // rather than a ref, so that the ProseMirror component
  // is re-rendered when it's set
  const [mount, setMount] = useState<HTMLElement | null>(null);

  return (
    <ProseMirror mount={mount} defaultState={defaultState}>
      <div ref={setMount} />
    </ProseMirror>
  );
}
```

The EditorState can also easily be lifted out of the ProseMirror component and
passed as a prop.

```tsx
import { EditorState } from "prosemirror-state";
import { schema } from "prosemirror-schema-basic";
import { ProseMirror } from "@nytimes/react-prosemirror";

export function ProseMirrorEditor() {
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [state, setState] = useState(() => EditorState.create({ schema }));

  return (
    <ProseMirror
      mount={mount}
      state={state}
      dispatchTransaction={(tr) => {
        setState((s) => s.apply(tr));
      }}
    >
      <div ref={setMount} />
    </ProseMirror>
  );
}
```

The ProseMirror component will take care to ensure that the EditorView is always
updated with the latest EditorState after each render cycle. Because
synchronizing the EditorView is a side effect, it _must_ happen in the effects
phase of the React render lifecycle, _after_ all of the ProseMirror component's
children have run their render functions. This means that special care must be
taken to access the EditorView from within other React components. In order to
abstract away this complexity, React ProseMirror provides two hooks:
`useEditorEffect` and `useEditorEventCallback`. Both of these hooks can be used
from any children of the ProseMirror component.

#### `useEditorEffect`

Often, it's necessary to position React components relative to specific
positions in the ProseMirror document. For example, you might have some widget
that needs to be positioned at the user's cursor. In order to ensure that this
positioning happens when the EditorView is in sync with the latest EditorState,
we can use `useEditorEffect`.

```tsx
// SelectionWidget.tsx
import { useRef } from "react";
import { useEditorEffect } from "@nytimes/react-prosemirror";

export function SelectionWidget() {
  const ref = useRef();

  useEditorEffect((view) => {
    if (!ref.current) return;

    const viewClientRect = view.dom.getBoundingClientRect();
    const coords = view.coordsAtPos(view.state.selection.anchor);

    ref.current.style.top = coords.top - viewClientRect.top;
    ref.current.style.left = coords.left - viewClientRect.left;
  });

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
      }}
    />
  );
}

// ProseMirrorEditor.tsx
import { EditorState } from "prosemirror-state";
import { schema } from "prosemirror-schema-basic";

import { SelectionWidget } from "./SelectionWidget.tsx";

export function ProseMirrorEditor() {
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [state, setState] = useState(() => EditorState.create({ schema }));

  return (
    <ProseMirror
      mount={mount}
      state={state}
      dispatchTransaction={(tr) => {
        setState((s) => s.apply(tr));
      }}
    >
      {/*
        We have to mount all components that need to access the
        EditorView as children of the ProseMirror component
      */}
      <SelectionWidget />
      <div ref={setMount} />
    </ProseMirror>
  );
}
```

#### `useEditorEventCallback`

It's also often necessary to dispatch transactions or execute side effects in
response to user actions, like mouse clicks and keyboard events. Note: if you
need to respond to keyboard events from _within_ the `contenteditable` element,
you should instead use [`useEditorEventListener`](#useEditorEventListener).

However, if you need to dispatch a transaction in response to some event
dispatched from a React component, like a tooltip or a toolbar button, you can
use `useEditorEventCallback` to create a stable function reference that can
safely access the latest value of the `EditorView`.

```tsx
// BoldButton.tsx
import { toggleMark } from "prosemirror-commands";
import { useEditorEventCallback } from "@nytimes/react-prosemirror";

export function BoldButton() {
  const onClick = useEditorEventCallback((view) => {
    const toggleBoldMark = toggleMark(view.state.schema.marks.bold);
    toggleBoldMark(view.state, view.dispatch, view);
  });

  return <button onClick={onClick}>Bold</button>;
}

// ProseMirrorEditor.tsx
import { EditorState } from "prosemirror-state";
import { schema } from "prosemirror-schema-basic";

import { BoldButton } from "./BoldButton.tsx";

export function ProseMirrorEditor() {
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [state, setState] = useState(() => EditorState.create({ schema }));

  return (
    <ProseMirror
      mount={mount}
      state={state}
      dispatchTransaction={(tr) => {
        setEditorState((s) => s.apply(tr));
      }}
    >
      {/*
        We have to mount all components that need to access the
        EditorView as children of the ProseMirror component
      */}
      <BoldButton />
      <div ref={setMount} />
    </ProseMirror>
  );
}
```

#### `useEditorEventListener`

`useEditorEventCallback` produces functions that can be passed to React
components as event handlers. If you need to listen to events that originate
_within the `contenteditable` node_, however, those event listeners need to be
registered with the `EditorView`'s `handleDOMEvents` prop.

You can use the `useEditorEventListener` hook to accomplish this. It takes an
`eventType` and an event listener. The event listener follows the usual
semantics for ProseMirror's `handleDOMEvents` prop:

- Returning `true` or calling `event.preventDefault` will prevent other
  listeners from running.
- Returning `true` will not automatically call `event.preventDefault`; if you
  want to prevent the default contenteditable behavior, you must call
  `event.preventDefault`.

You can use this hook to implement custom behavior in your node views:

```tsx
import { useEditorEventListener } from "@nytimes/react-prosemirror";

function Paragraph({ node, children }) {
  const nodeStart = useNodePos();

  useEditorEventListener("keydown", (view, event) => {
    if (event.code !== "ArrowDown") {
      return false;
    }
    const nodeEnd = nodeStart + node.nodeSize;
    const { selection } = view.state;
    if (selection.anchor < nodeStart || selection.anchor > nodeEnd) {
      return false;
    }
    event.preventDefault();
    alert("No down keys allowed!");
    return true;
  });

  return <p>{children}</p>;
}
```

### Building node views with React

The other way to integrate React and ProseMirror is to have ProseMirror render
node views using React components. The `<ProseMirror>` component recognizes when
a node view constructor returns a node view with a `component` property and it
renders the React component into the ProseMirror DOM element using a portal. The
node view constructor must return at least `dom` and `component` property, but
can also return any other node view properties. To support React node views, the
editor state must include the React plugin (see below).

Example usage:

```tsx
import {
  useEditorEventCallback,
  NodeViewComponentProps,
  react,
} from "@nytimes/react-prosemirror";
import { EditorState } from "prosemirror-state";
import { schema } from "prosemirror-schema-basic";

// Paragraph is more or less a normal React component, taking and rendering
// its children. The actual children will be constructed by ProseMirror and
// passed in here. Take a look at the NodeViewComponentProps type to
// see what other props will be passed to NodeView components.
function Paragraph({ children }: NodeViewComponentProps) {
  const onClick = useEditorEventCallback((view) => view.dispatch(whatever));
  return <p onClick={onClick}>{children}</p>;
}

// Make sure that your node views are defined outside of your copmonent, or are
// properly memoized. ProseMirror will teardown and rebuild all node views if
// the `nodeView` prop changes, leading to unbounded recursion if the reference
// is not stable.
const nodeViews = {
  paragraph: () => ({
    component: Paragraph,
    // We render the Paragraph component itself into a div element
    dom: document.createElement("div"),
    // We render the paragraph node's ProseMirror contents into
    // a span, which will be passed as children to the Paragraph
    // component.
    contentDOM: document.createElement("span"),
  }),
};

// You must add the `react` plugin to use React node views.
const state = EditorState.create({
  schema,
  plugins: [react()],
});

function ProseMirrorEditor() {
  const [mount, setMount] = useState<HTMLElement | null>(null);

  return (
    <ProseMirror mount={mount} nodeViews={nodeViews} defaultState={state}>
      <div ref={setMount} />
    </ProseMirror>
  );
}
```

## API

### `ProseMirror`

```tsx
import type { EditorState, Plugin, Transaction } from "prosemirror-state";
import type { EditorProps, EditorView, Plugin } from "prosemirror-view";
import type { ReactNode } from "react";

interface ProseMirrorProps extends EditorProps {
  mount: HTMLElement | null;
  children?: ReactNode | null;
  defaultState?: EditorState;
  state?: EditorState;
  plugins?: readonly Plugin[];
  dispatchTransaction?(this: EditorView, tr: Transaction): void;
}

type ProseMirror = (props: ProseMirrorProps) => JSX.Element;
```

Renders a ProseMirror View.

The `mount` prop must be an actual HTMLElement instance. The JSX element
representing the mount should be passed as a child to the ProseMirror component.

Consult the ProseMirror documentation for information about the other props.

Example usage:

```tsx
function MyProseMirrorField() {
  const [mount, setMount] = useState(null);

  return (
    <ProseMirror mount={mount}>
      <div ref={setMount} />
    </ProseMirror>
  );
}
```

### `react`

```tsx
type react = Plugin<Map<number, string>>;
```

A ProseMirror Plugin that assists in maintaining the correct hierarchy for React
node views.

If you use React node views, then your `EditorState` _must_ include this plugin.

### `useEditorState`

```tsx
type useEditorState = () => EditorState;
```

Provides access to the current EditorState value.

### `useEditorEventCallback`

```tsx
type useEditorEventCallback = <T extends unknown[]>(
  callback: (view: EditorView | null, ...args: T) => void
) => void;
```

Returns a stable function reference to be used as an event handler callback.

The callback will be called with the EditorView instance as its first argument.

### `useEditorEventListener`

```tsx
type useEditorEventListener = <EventType extends DOMEventMap>(
  eventType: EventType,
  listener: (view: EditorView, event: DOMEventMap[EventType]) => boolean
) => void;
```

Attaches an event listener at the `EditorView`'s DOM node. See
[the ProseMirror docs](https://prosemirror.net/docs/ref/#view.EditorProps.handleDOMEvents)
for more details.

### `useEditorEffect`

```tsx
type useEditorEffect = (
  effect: (editorView: EditorView | null) => void | (() => void),
  dependencies?: React.DependencyList
) => void;
```

Registers a layout effect to run after the EditorView has been updated with the
latest EditorState and Decorations.

Effects can take an EditorView instance as an argument. This hook should be used
to execute layout effects that depend on the EditorView, such as for positioning
DOM nodes based on ProseMirror positions.

Layout effects registered with this hook still fire synchronously after all DOM
mutations, but they do so _after_ the EditorView has been updated, even when the
EditorView lives in an ancestor component.

Example usage:

```tsx
import { useRef } from "react";
import { useEditorEffect } from "@nytimes/react-prosemirror";

export function SelectionWidget() {
  const ref = useRef();

  useEditorEffect((view) => {
    if (!ref.current) return;

    const viewClientRect = view.dom.getBoundingClientRect();
    const coords = view.coordsAtPos(view.state.selection.anchor);

    ref.current.style.top = coords.top - viewClientRect.top;
    ref.current.style.left = coords.left - viewClientRect.left;
  });

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
      }}
    />
  );
}
```

### `useNodePos`

```tsx
type useNodePos = () => number;
```

Returns the node's current position in the document. Takes the place of
ProseMirror's `getPos` function that gets passed to NodeView's, which is unsafe
to use in React render functions.
