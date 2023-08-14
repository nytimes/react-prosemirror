import * as browser from "./browser.js"
import {isEquivalentPosition, DOMSelectionRange} from "./dom.js"
import {hasFocusAndSelection, selectionFromDOM} from "./selection.js"
import {EditorViewInternal as EditorView} from "./EditorViewInternal.js"
import { MutableRefObject } from "react"

class SelectionState {
  anchorNode: Node | null = null
  anchorOffset: number = 0
  focusNode: Node | null = null
  focusOffset: number = 0

  set(sel: DOMSelectionRange) {
    this.anchorNode = sel.anchorNode; this.anchorOffset = sel.anchorOffset
    this.focusNode = sel.focusNode; this.focusOffset = sel.focusOffset
  }

  clear() {
    this.anchorNode = this.focusNode = null
  }

  eq(sel: DOMSelectionRange) {
    return sel.anchorNode == this.anchorNode && sel.anchorOffset == this.anchorOffset &&
      sel.focusNode == this.focusNode && sel.focusOffset == this.focusOffset
  }
}

export class DOMObserver {
  queue: MutationRecord[] = []
  flushingSoon = -1
  observer: MutationObserver | null = null
  currentSelection = new SelectionState
  onCharData: ((e: Event) => void) | null = null
  suppressingSelectionUpdates = false
  private dom: HTMLElement | null = null;

  constructor(
    readonly view: MutableRefObject<EditorView | null>,
  ) {
    this.onSelectionChange = this.onSelectionChange.bind(this)
  }

  flushSoon() {
    if (this.flushingSoon < 0)
      this.flushingSoon = window.setTimeout(() => { this.flushingSoon = -1; this.flush() }, 20)
  }

  connectSelection() {
    this.view.current!.dom.ownerDocument.addEventListener("selectionchange", this.onSelectionChange)
    this.dom = this.view.current!.dom
  }

  disconnectSelection() {
    this.dom?.ownerDocument.removeEventListener("selectionchange", this.onSelectionChange)
  }

  onSelectionChange() {
    if (!hasFocusAndSelection(this.view.current!)) return
    // Deletions on IE11 fire their events in the wrong order, giving
    // us a selection change event before the DOM changes are
    // reported.
    if (browser.ie && browser.ie_version <= 11 && !this.view.current!.state.selection.empty) {
      let sel = this.view.current!.domSelectionRange()
      // Selection.isCollapsed isn't reliable on IE
      if (sel.focusNode && isEquivalentPosition(sel.focusNode, sel.focusOffset, sel.anchorNode!, sel.anchorOffset))
        return this.flushSoon()
    }
    this.flush()
  }

  setCurSelection() {
    this.currentSelection.set(this.view.current!.domSelectionRange())
  }

  pendingRecords() {
    if (this.observer) for (let mut of this.observer.takeRecords()) this.queue.push(mut)
    return this.queue
  }

  flush() {
    let {view} = this
    if (!view.current!.docView || this.flushingSoon > -1) return
    let mutations = this.pendingRecords()
    if (mutations.length) this.queue = []

    const newSel = selectionFromDOM(view.current!)
    if (newSel) view.current!.dispatch(view.current!.state.tr.setSelection(newSel))
    let sel = view.current!.domSelectionRange()
    this.currentSelection.set(sel)
  }
}
