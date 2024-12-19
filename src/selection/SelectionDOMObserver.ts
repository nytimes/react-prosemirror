import { Selection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

import { browser } from "../browser.js";
import {
  DOMNode,
  DOMSelectionRange,
  parentNode,
  selectionCollapsed,
} from "../dom.js";

import { hasFocusAndSelection } from "./hasFocusAndSelection.js";
import { selectionFromDOM } from "./selectionFromDOM.js";
import { isEquivalentPosition, selectionToDOM } from "./selectionToDOM.js";

class SelectionState {
  anchorNode: Node | null = null;
  anchorOffset = 0;
  focusNode: Node | null = null;
  focusOffset = 0;

  set(sel: DOMSelectionRange) {
    this.anchorNode = sel.anchorNode;
    this.anchorOffset = sel.anchorOffset;
    this.focusNode = sel.focusNode;
    this.focusOffset = sel.focusOffset;
  }

  clear() {
    this.anchorNode = this.focusNode = null;
  }

  eq(sel: DOMSelectionRange) {
    return (
      sel.anchorNode == this.anchorNode &&
      sel.anchorOffset == this.anchorOffset &&
      sel.focusNode == this.focusNode &&
      sel.focusOffset == this.focusOffset
    );
  }
}

export class SelectionDOMObserver {
  flushingSoon = -1;
  currentSelection = new SelectionState();
  suppressingSelectionUpdates = false;

  constructor(readonly view: EditorView) {
    this.view = view;
    this.onSelectionChange = this.onSelectionChange.bind(this);
  }

  connectSelection() {
    this.view.dom.ownerDocument.addEventListener(
      "selectionchange",
      this.onSelectionChange
    );
  }

  disconnectSelection() {
    this.view.dom.ownerDocument.removeEventListener(
      "selectionchange",
      this.onSelectionChange
    );
  }

  stop() {
    this.disconnectSelection();
  }

  start() {
    this.connectSelection();
  }

  suppressSelectionUpdates() {
    this.suppressingSelectionUpdates = true;
    setTimeout(() => (this.suppressingSelectionUpdates = false), 50);
  }

  setCurSelection() {
    // @ts-expect-error Internal method
    this.currentSelection.set(this.view.domSelectionRange());
  }

  ignoreSelectionChange(sel: DOMSelectionRange) {
    if (!sel.focusNode) return true;
    const ancestors: Set<Node> = new Set();
    let container: DOMNode | undefined;
    for (
      let scan: DOMNode | null = sel.focusNode;
      scan;
      scan = parentNode(scan)
    )
      ancestors.add(scan);
    for (let scan = sel.anchorNode; scan; scan = parentNode(scan))
      if (ancestors.has(scan)) {
        container = scan;
        break;
      }
    // @ts-expect-error Internal property (docView)
    const desc = container && this.view.docView.nearestDesc(container);
    if (
      desc &&
      desc.ignoreMutation({
        type: "selection",
        target: container?.nodeType == 3 ? container?.parentNode : container,
      })
    ) {
      this.setCurSelection();
      return true;
    }
    return;
  }

  registerMutation() {
    // pass
  }

  flushSoon() {
    if (this.flushingSoon < 0)
      this.flushingSoon = window.setTimeout(() => {
        this.flushingSoon = -1;
        this.flush();
      }, 20);
  }

  updateSelection() {
    const { view } = this;
    const compositionID =
      // @ts-expect-error Internal property (input)
      view.input.compositionPendingChanges ||
      // @ts-expect-error Internal property (input)
      (view.composing ? view.input.compositionID : 0);
    // @ts-expect-error Internal property (input)
    view.input.compositionPendingChanges = 0;

    const origin =
      // @ts-expect-error Internal property (input)
      view.input.lastSelectionTime > Date.now() - 50
        ? // @ts-expect-error Internal property (input)
          view.input.lastSelectionOrigin
        : null;
    const newSel = selectionFromDOM(view, origin);
    if (newSel && !view.state.selection.eq(newSel)) {
      const tr = view.state.tr.setSelection(newSel);
      if (origin == "pointer") tr.setMeta("pointer", true);
      else if (origin == "key") tr.scrollIntoView();
      if (compositionID) tr.setMeta("composition", compositionID);
      view.dispatch(tr);
    }
  }

  selectionToDOM() {
    const { view } = this;
    selectionToDOM(view);
    // @ts-expect-error Internal property (domSelectionRange)
    const sel = view.domSelectionRange();
    this.currentSelection.set(sel);
  }

  flush() {
    const { view } = this;
    // @ts-expect-error Internal property (docView)
    if (!view.docView || this.flushingSoon > -1) return;

    // @ts-expect-error Internal property (domSelectionRange)
    const sel = view.domSelectionRange();
    const newSel =
      !this.suppressingSelectionUpdates &&
      !this.currentSelection.eq(sel) &&
      hasFocusAndSelection(view) &&
      !this.ignoreSelectionChange(sel);

    let readSel: Selection | null = null;
    // If it looks like the browser has reset the selection to the
    // start of the document after focus, restore the selection from
    // the state
    if (
      newSel &&
      // @ts-expect-error Internal property (input)
      view.input.lastFocus > Date.now() - 200 &&
      // @ts-expect-error Internal property (input)
      Math.max(view.input.lastTouch, view.input.lastClick.time) <
        Date.now() - 300 &&
      selectionCollapsed(sel) &&
      (readSel = selectionFromDOM(view)) &&
      readSel.eq(Selection.near(view.state.doc.resolve(0), 1))
    ) {
      // @ts-expect-error Internal property (input)
      view.input.lastFocus = 0;
      selectionToDOM(view);
      this.currentSelection.set(sel);
      // @ts-expect-error Internal property (scrollToSelection)
      view.scrollToSelection();
    } else if (newSel) {
      this.updateSelection();
      if (!this.currentSelection.eq(sel)) selectionToDOM(view);
      this.currentSelection.set(sel);
    }
  }

  forceFlush() {
    if (this.flushingSoon > -1) {
      window.clearTimeout(this.flushingSoon);
      this.flushingSoon = -1;
      this.flush();
    }
  }

  onSelectionChange() {
    if (!hasFocusAndSelection(this.view)) return;
    if (this.view.composing) return;
    if (this.suppressingSelectionUpdates) return selectionToDOM(this.view);
    // Deletions on IE11 fire their events in the wrong order, giving
    // us a selection change event before the DOM changes are
    // reported.
    if (
      browser.ie &&
      browser.ie_version <= 11 &&
      !this.view.state.selection.empty
    ) {
      // @ts-expect-error Internal method
      const sel = this.view.domSelectionRange();
      // Selection.isCollapsed isn't reliable on IE
      if (
        sel.focusNode &&
        isEquivalentPosition(
          sel.focusNode,
          sel.focusOffset,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          sel.anchorNode!,
          sel.anchorOffset
        )
      )
        return this.flushSoon();
    }
    this.flush();
  }
}
