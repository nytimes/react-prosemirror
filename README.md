# React ProseMirror

A fully featured library for safely integrating ProseMirror and React.

## Installation

npm:

```sh
npm install react-prosemirror
```

yarn:

```sh
yarn add react-prosemirror
```

<!-- toc -->

- [The Problem](#the-problem)
- [The Solution](#the-solution)
  * [Rendering ProseMirror Views within React](#rendering-prosemirror-views-within-react)
    + [`useEditorViewLayoutEffect`](#useeditorviewlayouteffect)
    + [`useEditorViewEvent`](#useeditorviewevent)
    + [`useEditorView`, `EditorViewContext` and `DeferredLayoutEffectsProvider`](#useeditorview-editorviewcontext-and-deferredlayouteffectsprovider)
  * [Building NodeViews with React](#building-nodeviews-with-react)
- [API](#api)
  * [`ProseMirror`](#prosemirror)
  * [`EditorViewContext`](#editorviewcontext)
  * [`DeferredLayoutEffectsProvider`](#deferredlayouteffectsprovider)
  * [`useDeferredLayoutEffect`](#usedeferredlayouteffect)
  * [`useEditorState`](#useeditorstate)
  * [`useEditorView`](#useeditorview)
  * [`useEditorViewEvent`](#useeditorviewevent-1)
  * [`useEditorViewLayoutEffect`](#useeditorviewlayouteffect-1)
  * [`useNodeViewPortals`](#usenodeviewportals)
  * [`createReactNodeViewConstructor`](#createreactnodeviewconstructor)

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
import { ProseMiror } from "prosemirror-react";

export function ProseMirrorEditor() {
  // It's important that mount is stored as state,
  // rather than a ref, so that the ProseMirror component
  // is re-rendered when it's set
  const [mount, setMount] = useState();

  return (
    <ProseMirror mount={mount} editorState={EditorState.create({ schema })}>
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
import { ProseMirror } from "prosemirror-react";

export function ProseMirrorEditor() {
  const [mount, setMount] = useState();
  const [editorState, setEditorState] = useState(
    EditorState.create({ schema })
  );

  return (
    <ProseMirror
      mount={mount}
      editorState={editorState}
      dispatchTransaction={(tr) => {
        setEditorState((s) => s.apply(tr));
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
abstract away this complexity, ProseMirror-React provides two hooks:
`useEditorViewLayoutEffect` and `useEditorViewEvent`. Both of these hooks can be
used from any children of the ProseMirror component.

#### `useEditorViewLayoutEffect`

Often, it's necessary to position React components relative to specific
positions in the ProseMirror document. For example, you might have some widget
that needs to be positioned at the user's cursor. In order to ensure that this
positioning happens when the EditorView is in sync with the latest EditorState,
we can use `useEditorViewLayoutEffect`.

```tsx
// ProseMirrorEditor.tsx
import { EditorState } from 'prosemirror-state';
import { schema } from 'prosemirror-schema-basic';

export function ProseMirrorEditor() {
  const [mount, setMount] = useState()
  const [editorState, setEditorState] = useState(EditorState.create({ schema }))

  return (
    <ProseMirror
      mount={mount}
      editorState={editorState}
      dispatchTransaction={(tr) => {
        setEditorState(s => s.apply(tr))
      }}
    >
      {/*
        We have to mount all components that need to access the
        EditorView as children of the ProseMirrer component
      */}
      <SelectionWidget />
      <div ref={setMount} />
    </ProseMirror>
  )
}

// SelectionWidget.tsx
import { useEditorViewLayoutEffect } from 'prosemirror-react';

export function SelectionWidget() {
  const [selectionCoords, setSelectionCoords] = useState()

  useEditorViewLayoutEffect((view) => {
    setSelectionCoords(view.coordsAtPos(view.state.selection.anchor))
  })

  return (
    <div
      style={{
        position: 'absolute';
        left: selectionCoords.left;
        top: selectionCoords.top;
      }}
    />
  )
}
```

#### `useEditorViewEvent`

It's also often necessary to dispatch transactions or execute side effects in
response to user actions, like mouse clicks and keyboard events. Note: if you
need to respond to keyboard events from _within_ the `contenteditable` element,
you most likely need to use a ProseMirror plugin with an event handler.

However, if you need to dispatch a transaction in response to some event
dispatched from a React component, like a tooltip or a toolbar button, you can
use `useEditorViewEvent` to create a stable function reference that can safely
access the latest value of the `EditorView`.

```tsx
// ProseMirrorEditor.tsx
import { EditorState } from "prosemirror-state";
import { schema } from "prosemirror-schema-basic";

export function ProseMirrorEditor() {
  const [mount, setMount] = useState();
  const [editorState, setEditorState] = useState(
    EditorState.create({ schema })
  );

  return (
    <ProseMirror
      mount={mount}
      editorState={editorState}
      dispatchTransaction={(tr) => {
        setEditorState((s) => s.apply(tr));
      }}
    >
      {/*
        We have to mount all components that need to access the
        EditorView as children of the ProseMirrer component
      */}
      <BoldButton />
      <div ref={setMount} />
    </ProseMirror>
  );
}

// BoldButton.tsx
import { toggleMark } from "prosemirror-commands";
import { useEditorViewEvent } from "prosemirror-react";

export function BoldButton() {
  const onClick = useEditorViewEvent((view) => {
    const toggleBoldMark = toggleMark(view.state.schema.marks.bold);
    toggleBoldMark(view.state, view.dispatch, view);
  });

  return <button onClick={onClick}>Bold</button>;
}
```

#### `useEditorView`, `EditorViewContext` and `DeferredLayoutEffectsProvider`

Under the hood, the `ProseMirror` component essentially just composes three
separate tools: `useEditorView`, `EditorViewContext`, and
`DeferredLayoutEffectsProvider`. If you find yourself in need of more control
over these, they can also be used independently.

`useEditorView` is a relatively simple hook that takes a mount point and
`EditorProps` as arguments and returns an EditorView instance.

`EditorViewContext` is a simple React context, which should be provided the
current EditorView and EditorState.

`DeferredLayoutEffectsProvider` _must_ be rendered as a parent of the component
using `useEditorView`.

### Building NodeViews with React

The other way to integrate React and ProseMirror is to have ProseMirror render
NodeViews using React components. This is somewhat more complex than the
previous section. This library provides a factory for creating NodeView
constructors from React components, the `useNodeViews` hook.

`useNodeViews` takes map from node name to a record containing a NodeView
constructor and a React component. The NodeView constructor must return at least
a `dom` attribute, but can also return any other NodeView attributes, aside from
the `update` method. Here's an example of its usage:

```tsx
import { EditorState } from 'prosemirror-state';
import { schema } from 'prosemirror-schema-basic';
import {
  useNodeViews
} from 'prosemirror-react';

type Props = {
  children: ReactNode;
};

// Paragraph is more or less a normal React component, taking and rendering
// its children. The actual children will be constructed by ProseMirror and
// passed in here.
function Paragraph({ children }: Props) {
  const onClick = useEditorViewEvent((view) => view.dispatch(whatever))
  return <p onClick={onClick}>{children}</p>;
}

function ProseMirrorEditor() {
  const { nodeViews, renderNodeViews } = useNodeViews({
    paragraph: {
      component: Paragraph,
      // This is a standard NodeView constructor. It will be called with
      // the node, editorView, getPos, and decorations.
      constructor: () => ({
        // We render the Paragraph component itself into a div element
        dom: document.createElement('div'),
        // We render the paragraph node's ProseMirror contents into
        // a span, which will be passed as children to the Paragraph
        // component.
        contentDOM: document.createElement('span');
      })
    }
  });

  const [mount, setMount] = useState()

  return (
    <ProseMirror
      mount={mount}
      editorState={EditorState.create({ schema })}
      nodeViews={nodeViews}
    >
      <div ref={setMount} />
      {renderNodeViews()}
    </ProseMirror>
  );
}
```

## API

### `ProseMirror`

```tsx
type ProseMirror = (props: {
  dispatchTransaction: (tr: Transaction) => void;
  editorProps: EditorProps;
  editorState: EditorState;
  mount: HTMLElement | null;
  children?: ReactNode | null;
}) => JSX.Element;
```

Renders the ProseMirror View onto a DOM mount.

The `mount` prop must be an actual HTMLElement instance. The JSX element
representing the mount should be passed as a child to the ProseMirror component.

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

### `EditorViewContext`

```tsx
type EditorViewContext = React.Context<{
  editorView: EditorView | null;
  editorState: EditorState | null;
}>;

Provides the EditorView, as well as the current EditorState. Should not be
consumed directly; instead see [`useEditorState`](#useeditorstate),
[`useEditorViewEvent`](#useeditorviewevent), and
[`useEditorViewLayoutEffect`](#useeditorviewlayouteffect).
```

See [ProseMirrorInner.tsx](./src/components/ProseMirrorInner.tsx) for example
usage. Note that if you are using the [`ProseMirror`](#prosemirror) component,
you don't need to use this context directly.

### `DeferredLayoutEffectsProvider`

```tsx
type DeferredLayoutEffectsProvider = (props: {
  children: React.ReactNode;
}) => JSX.Element;
```

Provides a deferral point for deferred layout effects. All effects registered
with `useDeferredLayoutEffect` by children of this provider will execute _after_
all effects registered by `useLayoutEffect` by children of this provider.

See [ProseMirror.tsx](./src/components/ProseMirror.tsx) for example usage. Note
that if you are using the [`ProseMirror`](#prosemirror) component, you don't
need to use this context directly.

### `useDeferredLayoutEffect`

```tsx
type useDeferredlayoutEffect = (
  effect: React.EffectCallback,
  deps?: React.DependencyList
) => void;
```

Like `useLayoutEffect`, but all effect executions are run _after_ the
`DeferredLayoutEffectsProvider` layout effects phase.

This hook allows child components to enqueue layout effects that won't be safe
to run until after a parent component's layout effects have run.

Note that components that use this hook must be descendants of the
[`DeferredLayoutEffectsProvider`](#deferredlayouteffectsprovider) component.

### `useEditorState`

```tsx
type useEditorState = () => EditorState | null;
```

Provides access to the current EditorState value.

### `useEditorView`

```tsx
type useEditorView = <T extends HTMLElement = HTMLElement>(
  mount: T | null,
  props: DirectEditorProps
) => EditorView | null;
```

Creates, mounts, and manages a ProseMirror `EditorView`.

All state and props updates are executed in a layout effect. To ensure that the
EditorState and EditorView are never out of sync, it's important that the
EditorView produced by this hook is only accessed through the
`useEditorViewEvent` and `useEditorViewLayoutEffect` hooks.

See [ProseMirrorInner.tsx](./src/components/ProseMirrorInner.tsx) for example
usage. Note that if you are using the [`ProseMirror`](#prosemirror) component,
you don't need to use this hook directly.

### `useEditorViewEvent`

```tsx
type useEditorViewEvent = <T extends unknown[]>(
  callback: (view: EditorView | null, ...args: T) => void
) => void;
```

Returns a stable function reference to be used as an event handler callback.

The callback will be called with the EditorView instance as its first argument.

This hook is dependent on both the `EditorViewContext.Provider` and the
`DeferredLayoutEffectProvider`. It can only be used in a component that is
mounted as a child of both of these providers.

### `useEditorViewLayoutEffect`

```tsx
type useEditorViewLayoutEffect = (
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
import { useEditorViewLayoutEffect } from 'prosemirror-react';

export function SelectionWidget() {
  const [selectionCoords, setSelectionCoords] = useState()

  useEditorViewLayoutEffect((view) => {
    setSelectionCoords(view.coordsAtPos(view.state.selection.anchor))
  })

  return (
    <div
      style={{
        position: 'absolute';
        left: selectionCoords.left;
        top: selectionCoords.top;
      }}
    />
  )
}
```

### `useNodeViewPortals`

```tsx
type useNodeViewPortals = () => {
  portals: React.ReactPortal[];
  registerPortal: (
    children: React.ReactNode,
    container: Element | DocumentFragment,
    key?: string | null | undefined
  ) => () => void;
};
```

Provides an array of React portals and a callback for registering new portals.

The `registerPortal` callback is meant to be passed to
`createNodeViewConstructor` as the `registerElement` argument. The `portals`
array should be passed as children to the `ProseMirror` component.

Example usage:

```tsx
function ProseMirrorEditor() {
  const { portals, registerPortal } = useNodeViewPortals();
  const [mount, setMount] = useState()

  const nodeViews: EditorProps['nodeViews'] = useMemo(() => ({
    paragraph: createReactNodeViewConstructor(
      Paragraph,
      registerPortal,
      () => ({
        dom: document.createElement('div'),
        contentDOM: document.createElement('span');
      })
    ),
  }), [registerPortal]);

  return (
    <ProseMirror
      mount={mount}
      editorState={EditorState.create({ schema })}
      nodeViews={nodeViews}
    >
      <div ref={setMount} />
      {portals}
    </ProseMirror>
  );
}
```

### `createReactNodeViewConstructor`

```tsx
type createReactNodeViewConstructor = (
  ReactComponent: React.ComponentType<{
    decorations: readonly Decoration[];
    getPos: () => number;
    node: Node;
    children: React.ReactNode;
    isSelected: boolean;
  }>,
  registerElement: (
    children: React.ReactNode,
    container: Element | DocumentFragment,
    key?: string | null | undefined
  ) => () => void,
  innerConstructor: (
    node: Node,
    editorView: EditorView,
    getPos: () => number,
    decorations: readonly Decoration[]
  ) => Partial<Omit<NodeView, "update">> & Pick<NodeView, "dom">
) => (
  node: Node,
  editorView: EditorView,
  getPos: () => number,
  decorations: readonly Decoration[]
) => NodeView;
```

Factory function for creating nodeViewConstructors that render as React
components.

`ReactComponent` can be any React component that takes `NodeViewComponentProps`.
It will be passed all of the arguments to the `nodeViewConstructor` except for
`editorView`. NodeView components that need access directly to the EditorView
should use the `useEditorViewEvent` and `useEditorViewLayoutEffect` hooks to
ensure safe access.

For contentful Nodes, the NodeView component will also be passed a `children`
prop containing an empty element. ProseMirror will render content nodes into
this element.
