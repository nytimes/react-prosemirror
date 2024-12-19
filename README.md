# React ProseMirror

<p align="center">
  <img src="react-prosemirror-logo.png" alt="React ProseMirror Logo" width="120px" height="120px"/>
  <br>
  <em>A fully featured library for safely integrating ProseMirror and React.</em>
  <br>
</p>

[![Join the chat at https://gitter.im/nytimes/react-prosemirror](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/nytimes/react-prosemirror?utm_source=badge&utm_medium=badge&utm_content=badge)

> ## The state of this library
>
> `@nytimes/react-prosemirror` just published its first stable release,
> [v1.0.0](https://www.npmjs.com/package/@nytimes/react-prosemirror/v/1.0.0).
> The code for that version of the library lives on the
> [v1.x branch](https://github.com/nytimes/react-prosemirror/tree/v1.x), and
> users of that version should view the
> [README.md](https://github.com/nytimes/react-prosemirror/blob/v1.x/README.md)
> on that branch for relevant documentation.
>
> Moving forward, the main branch of this library will focus on the upcoming v2
> release, previously the react-editor-view branch. This entails a significant
> re-write of the underlying EditorView integration, and will include some
> breaking API changes.
>
> To try out the new version, install `@nytimes/react-prosemirror@next`. We'd
> love to hear your thoughts!

## Installation

_Note_: React ProseMirror releases are coupled to specific prosemirror-view
releases, and are not guaranteed to work with other versions of
prosemirror-view. Ensure that your version of prosemirror-view matches the
version in React ProseMirror's peer dependencies!

npm:

```sh
npm install @nytimes/react-prosemirror@next prosemirror-view@1.37.1 prosemirror-state prosemirror-model
```

yarn:

```sh
yarn add @nytimes/react-prosemirror@next prosemirror-view@1.37.1 prosemirror-state prosemirror-model
```

<!-- toc -->

- [The Problem](#the-problem)
- [The Solution](#the-solution)
  - [Rendering ProseMirror Views within React](#rendering-prosemirror-views-within-react)
    - [`useEditorEffect`](#useeditoreffect)
    - [`useEditorEventCallback`](#useeditoreventcallback)
    - [`useEditorEventListener`](#useeditoreventlistener)
  - [Building node views with React](#building-node-views-with-react)
- [What's changing in v2?](#whats-changing-in-v2)
  - [API changes](#api-changes)
- [API](#api)
  - [`ProseMirror`](#prosemirror)
  - [`ProseMirrorDoc`](#prosemirrordoc)
  - [`useEditorState`](#useeditorstate)
  - [`useEditorEventCallback`](#useeditoreventcallback-1)
  - [`useEditorEventListener`](#useeditoreventlistener-1)
  - [`useEditorEffect`](#useeditoreffect-1)
  - [`NodeViewComponentProps`](#nodeviewcomponentprops)
  - [`useStopEvent`](#usestopevent)
  - [`useSelectNode`](#useselectnode)
  - [`widget`](#widget)

<!-- tocstop -->

## The Problem

To make updates efficient, React separates updates into phases so that it can
process updates in batches. In the first phase, application code renders a
virtual document. In the second phase, the React DOM renderer finalizes the
update by reconciling the real document with the virtual document.

On the other hand, the ProseMirror View library renders ProseMirror documents in
a single-phase update. Unlike React, it also allows built-in editing features of
the browser to modify the document under some circumstances, deriving state
updates from view updates rather than the other way around.

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

It's also challenging to effectively use React to define node views for
ProseMirror documents. Both ProseMirror and React expect to have full control
over their respective parts of the DOM. They both modify and destroy DOM nodes
as needed. Previous solutions (including previous iterations of this library)
have attempted to work around this power struggle by producing wrapper elements
to hand to ProseMirror, and then mounting React nodes within these (usually with
React Portals).

This approach works, but tenuously. Having additional nodes in the document that
ProseMirror isn't strictly aware of can cause issues with its change detection
system, leading to challenging edge cases.
[Here's an example](https://github.com/nytimes/react-prosemirror/issues/42).
These extra wrapping elements also make it challenging to produce semantic
markup and introduce challenges when styling.

## The Solution

This library provides an alternate implementation of ProseMirror's EditorView.
It uses React as the rendering engine, rather than ProseMirror's home-brewed DOM
update system. This allows us to provide a more comfortable integration with
ProseMirror's powerful data model, transformations, and event management
systems.

### Rendering ProseMirror Views within React

This library provides a set of React contexts and hooks for consuming them that
ensure safe access to the EditorView from React components. This allows us to
build React applications that contain ProseMirror Views, even when the
EditorState is lifted into React state, or a global state management system like
Redux.

The simplest way to make use of these contexts is with the `<ProseMirror />`
component. The `<ProseMirror />` component can be used controlled (via the
`state` prop) or uncontrolled (via the `defaultState` prop).

```tsx
import { EditorState } from "prosemirror-state";
import {
  ProseMirror,
  ProseMirrorDoc,
  reactKeys,
} from "@nytimes/react-prosemirror";

export function ProseMirrorEditor() {
  return (
    <ProseMirror
      defaultState={EditorState.create({
        schema,
        plugins: [
          // The reactKeys plugin is required for the ProseMirror component to work!
          reactKeys(),
        ],
      })}
    >
      <ProseMirrorDoc />
    </ProseMirror>
  );
}
```

The EditorState can also easily be lifted out of the ProseMirror component and
passed as a prop.

```tsx
import { EditorState } from "prosemirror-state";
import { schema } from "prosemirror-schema-basic";
import {
  ProseMirror,
  ProseMirrorDoc,
  reactKeys,
} from "@nytimes/react-prosemirror";

export function ProseMirrorEditor() {
  const [editorState, setEditorState] = useState(
    EditorState.create({ schema, plugins: [reactKeys()] })
  );

  return (
    <ProseMirror
      state={editorState}
      dispatchTransaction={(tr) => {
        setEditorState((s) => s.apply(tr));
      }}
    >
      <ProseMirrorDoc />
    </ProseMirror>
  );
}
```

The `EditorView` interface exposes several useful methods that provide access to
the DOM or data derived from its layout, such as `coordsFromPos`. These methods
should only be accessed outside of the render cycle, to ensure that the DOM has
been updated to match the latest state. React ProseMirror provides two hooks to
enable this access pattern: `useEditorEffect` and `useEditorEventCallback`. Both
of these hooks can be used from any children of the ProseMirror component.

#### `useEditorEffect`

Often, it's necessary to position React components relative to specific
positions in the ProseMirror document. For example, you might have some widget
that needs to be positioned at the user's cursor. In order to ensure that this
positioning happens when the DOM is in sync with the latest EditorState, we can
use `useEditorEffect`.

```tsx
// SelectionWidget.tsx
import { useRef } from "react";
import { useEditorEffect } from "@nytimes/react-prosemirror";

export function SelectionWidget() {
  const ref = useRef();

  useEditorEffect((view) => {
    if (!view || !ref.current) return;

    const viewClientRect = view.dom.getBoundingClientRect();
    const coords = view.coordsAtPos(view.state.selection.anchor));

    ref.current.style.top = coords.top - viewClientRect.top;
    ref.current.style.left = coords.left - viewClientRect.left;
  })

  return (
    <div
      ref={ref}
      style={{
        position: "absolute"
      }}
    />
  );
}

// ProseMirrorEditor.tsx
import {
  ProseMirror,
  ProseMirrorDoc,
  reactKeys
} from '@nytimes/react-prosemirror';
import { EditorState } from "prosemirror-state";
import { schema } from "prosemirror-schema-basic";

import { SelectionWidget } from "./SelectionWidget.tsx";

export function ProseMirrorEditor() {
  const [editorState, setEditorState] = useState(
    EditorState.create({ schema, plugins: [reactKeys()] })
  );

  return (
    <ProseMirror
      state={editorState}
      dispatchTransaction={(tr) => {
        setEditorState(s => s.apply(tr))
      }}
    >
      <ProseMirrorDoc />
      {/*
        We have to mount all components that need to access the
        EditorView as children of the ProseMirror component
      */}
      <SelectionWidget />
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
    if (!view) return;
    const toggleBoldMark = toggleMark(view.state.schema.marks.bold);
    toggleBoldMark(view.state, view.dispatch, view);
  });

  return <button onClick={onClick}>Bold</button>;
}

// ProseMirrorEditor.tsx
import {
  ProseMirror,
  ProseMirrorDoc,
  reactKeys,
} from "@nytimes/react-prosemirror";
import { EditorState } from "prosemirror-state";
import { schema } from "prosemirror-schema-basic";

import { BoldButton } from "./BoldButton.tsx";

export function ProseMirrorEditor() {
  const [editorState, setEditorState] = useState(
    EditorState.create({ schema, plugins: [reactKeys()] })
  );

  return (
    <ProseMirror
      state={editorState}
      dispatchTransaction={(tr) => {
        setEditorState((s) => s.apply(tr));
      }}
    >
      <ProseMirrorDoc />
      {/*
        We have to mount all components that need to access the
        EditorView as children of the ProseMirror component
      */}
      <BoldButton />
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

You can use this hook to implement custom behavior in your NodeViews:

```tsx
import { forwardRef, Ref } from "react";
import {
  useEditorEventListener,
  NodeViewComponentProps,
} from "@nytimes/react-prosemirror";

const Paragraph = forwardRef<HTMLParagraphElement, NodeViewComponentProps>(
  function Paragraph({ children, nodeProps, ...props }, ref) {
    useEditorEventListener("keydown", (view, event) => {
      const { pos, node } = nodeProps;

      if (event.code !== "ArrowDown") {
        return false;
      }
      const nodeEnd = pos + node.nodeSize;
      const { selection } = view.state;
      if (selection.anchor < pos || selection.anchor > nodeEnd) {
        return false;
      }
      event.preventDefault();
      alert("No down keys allowed!");
      return true;
    });

    return (
      <p ref={ref} {...props}>
        {children}
      </p>
    );
  }
);
```

### Building node views with React

The other way to integrate React and ProseMirror is to have ProseMirror render
node views using React components. Because React ProseMirror renders the
ProseMirror document with React, node view components don't need to do anything
special other than fulfill the
[`NodeViewComponentProps`](#nodeviewcomponentprops) interface.

```tsx
import { forwardRef, Ref } from "react";
import {
  ProseMirror,
  ProseMirrorDoc,
  useEditorEventCallback,
  NodeViewComponentProps,
  reactKeys,
} from "@nytimes/react-prosemirror";
import { EditorState } from "prosemirror-state";
import { schema } from "prosemirror-schema-basic";

// Paragraph is more or less a normal React component, taking and rendering
// its children. All node view components _must_ forward refs to their top-level
// DOM elements. All node view components _should_ spread all of the props that they
// receive onto their top-level DOM elements; this is required for node Decorations
// that apply attributes rather than wrapping nodes in an additional element.
const Paragraph = forwardRef<HTMLParagraphElement, NodeViewComponentProps>(
  function Paragraph({ children, nodeProps, ...props }, ref) {
    const onClick = useEditorEventCallback((view) =>
      view.dispatch(view.state.tr.deleteSelection())
    );

    return (
      <p ref={ref} {...props} onClick={onClick}>
        {children}
      </p>
    );
  }
);

function ProseMirrorEditor() {
  return (
    <ProseMirror
      defaultState={EditorState.create({ schema, plugins: [reactKeys()] })}
      nodeViews={{
        paragraph: Paragraph,
      }}
    >
      <ProseMirrorDoc />
    </ProseMirror>
  );
}
```

## What's changing in v2?

The upcoming v2 release constitutes a significant re-write of the library.

Previously, React ProseMirror relied on ProseMirror's EditorView to manage the
DOM for the editor. To integrate it with React, we used React
[portals](https://react.dev/reference/react-dom/createPortal) to render
components into ProseMirror-managed DOM nodes, and a
[useLayoutEffect](https://react.dev/reference/react/useLayoutEffect) to sync
state updates with the EditorView instance.

This approach provided some challenges. First, portals have to be rendered into
existing, stable DOM nodes, so all React-based custom node views ended up
wrapped in extra HTML elements. This made styling and producing valid DOM more
challenging than it should be, and introduced corner cases in browser
contenteditable implementations. Second, we induced a double render for every
ProseMirror update, and during the first render, React-based custom node views
will be rendered with the previous state. This is technically another form of
the state tearing that this library was designed to prevent, as all _other_
React components will be rendered with the new state!

To overcome these challenges, the new release moves rendering responsibility
entirely into React. We disabled the EditorView's DOM update cycle, and
implemented the same update algorithm that prosemirror-view uses with React
components. The result is a more idiomatic, React-based library, which doesn't
have any of the issues of the original implementation.

### API changes

- The [`ProseMirror`](#prosemirror) component API has changed slightly:
  - Instead of passing a `mount` prop with a ref to a child element, users must
    render a [`ProseMirrorDoc`](#prosemirrordoc) component as a child of the
    `ProseMirror` component.
  - The `nodeViews` prop no longer matches the ProseMirror API. Instead,
    `nodeViews` should be a map from node type name to React components, each of
    which must take [`NodeViewComponentProps`](#nodeviewcomponentprops) as
    props. This map should be memoized, or defined outside the React component
    entirely.
  - To pass standard ProseMirror node view constructors, use the
    `customNodeViews` prop
- The API that React-based node views must implement has changed:
  - There is no longer any need to provide a ProseMirror node view constructor
    function. React-based node views are now just React components that accept
    `NodeViewComponentProps` as props.
  - Props related to the ProseMirror node, such as the node itself, the `getPos`
    function, and decorations, now live in the `nodeProps` property. All other
    props _must_ be spread onto the root element of the node view component,
    aside from `children`, which may be rendered anywhere in the component, as
    appropriate.
  - All node view components must forward their ref to the root element of the
    component.
  - To implement features that would normally live in the node view spec, there
    are new hooks, such as [`useStopEvent`](#usestopevent) and
    [`useSelectNode`](#useselectnode)
- There is a new export, [`widget`](#widget), which behaves similarly to
  `Decoration.widget` from `prosemirror-view`, but takes a React component
  instead of a `toDOM` method.

## API

### `ProseMirror`

```tsx
type ProseMirror = (
  props: DirectEditorProps &
    ({ defaultState: EditorState } | { state: EditorState }) & {
      children: ReactNode;
      nodeViews?: {
        [nodeType: string]: ForwardRefExoticComponent<
          NodeViewComponentProps & RefAttributes<any>
        >;
      };
      customNodeViews?: {
        [nodeType: string]: NodeViewConstructor;
      };
    }
) => JSX.Element;
```

Renders the ProseMirror editor.

Example usage:

```tsx
import { EditorState } from "prosemirror-state";
import {
  ProseMirror,
  ProseMirrorDoc,
  reactKeys,
} from "@nytimes/react-prosemirror";

export function ProseMirrorEditor() {
  return (
    <ProseMirror
      defaultState={EditorState.create({ schema, plugins: [reactKeys()] })}
    >
      <ProseMirrorDoc />
    </ProseMirror>
  );
}
```

### `ProseMirrorDoc`

```tsx
type ProseMirrorDoc = (props: { as?: ReactElement }) => JSX.Element;
```

Renders the actual editable ProseMirror document.

This **must** be passed as a child to the `ProseMirror` component. It may be
wrapped in any other components, and other children may be passed before or
after

Example usage:

```tsx
import { EditorState } from "prosemirror-state";
import {
  ProseMirror,
  ProseMirrorDoc,
  reactKeys,
} from "@nytimes/react-prosemirror";

export function ProseMirrorEditor() {
  return (
    <ProseMirror
      defaultState={EditorState.create({ schema, plugins: [reactKeys()] })}
    >
      <ToolBar />
      <SomeWrapper>
        <ProseMirrorDoc as={<article />} />
      </SomeWrapper>
      <Footnotes />
    </ProseMirror>
  );
}
```

### `useEditorState`

```tsx
type useEditorState = () => EditorState | null;
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

This hook is dependent on both the `EditorContext.Provider` and the
`LayoutGroup`. It can only be used in a component that is mounted as a child of
both of these providers.

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
import { useRef } from "react"
import { useEditorEffect } from "@nytimes/react-prosemirror"

export function SelectionWidget() {
  const ref = useRef()

  useEditorEffect((view) => {
    if (!view || !ref.current) return

    const viewClientRect = view.dom.getBoundingClientRect()
    const coords = view.coordsAtPos(view.state.selection.anchor))

    ref.current.style.top = coords.top - viewClientRect.top;
    ref.current.style.left = coords.left - viewClientRect.left;
  })

  return (
    <div
      ref={ref}
      style={{
        position: "absolute"
      }}
    />
  )
}
```

### `NodeViewComponentProps`

```tsx
type NodeViewComponentProps = {
  nodeProps: {
    decorations: readonly Decoration[];
    innerDecorations: DecorationSource;
    node: Node;
    children?: ReactNode | ReactNode[];
    getPos: () => number;
  };
} & HTMLAttributes<HTMLElement>;
```

The props that will be passed to all node view components. These props map
directly to the arguments passed to
[`NodeViewConstructor` functions](https://prosemirror.net/docs/ref/#view.NodeViewConstructor)
by the default ProseMirror EditorView implementation.

Node view components may also be passed _any_ other valid HTML attribute props,
and should pass them through to their top-level DOM element.
[See the above example](#building-node-views-with-react) for more details.

In addition to accepting these props, all node view components _must_ forward
their ref to their top-level DOM element.

### `useStopEvent`

```tsx
type useStopEvent = (stopEvent: (view: EditorView, event: Event) => boolean): void
```

This hook can be used within a node view component to register a
[stopEvent handler](https://prosemirror.net/docs/ref/#view.NodeView.stopEvent).
Events for which this returns true are not handled by the editor.

### `useSelectNode`

```tsx
type useSelectNode = (selectNode: () => void, deselectNode?: () => void): void
```

This hook can be used within a node view component to register
[selectNode and deselectNode handlers](https://prosemirror.net/docs/ref/#view.NodeView.selectNode).
The selectNode handler will only be called when a NodeSelection is created whose
node is this one.

### `widget`

```tsx
type widget = (
  pos: number,
  component: ForwardRefExoticComponent<
    RefAttributes<HTMLElement> & WidgetComponentProps
  >,
  spec?: ReactWidgetSpec
) => Decoration(pos, pos, new ReactWidgetType(component, spec))
```

Like ProseMirror View's `Decoration.widget`, but with support for React
components.
