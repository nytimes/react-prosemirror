import { EditorView } from "prosemirror-view";

import { browser } from "../browser.js";
import { DOMNode, DOMSelectionRange, parentNode } from "../dom.js";

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
      } as any)
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

  flush() {
    const { view } = this;
    // @ts-expect-error Internal property
    if (!view.docView || this.flushingSoon > -1) return;

    const newSel = selectionFromDOM(view);
    if (newSel) view.dispatch(view.state.tr.setSelection(newSel));
    // @ts-expect-error Internal method
    const sel = view.domSelectionRange();
    this.currentSelection.set(sel);
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
