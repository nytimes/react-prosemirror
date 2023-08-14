import { DOMObserver } from "./prosemirror-view/domobserver.js";
import { EditorView } from "./prosemirror-view/index.js";
import { selectionFromDOM } from "./prosemirror-view/selection.js";

export class SelectionDOMObserver extends DOMObserver {
  constructor(readonly view: EditorView) {
    super(view, () => {
      // We don't actually want to do anything in response to dom changes
    });
    this.observer = null;
  }

  stop() {
    this.disconnectSelection();
  }

  start() {
    this.connectSelection();
  }

  flush() {
    const { view } = this;
    if (!view.docView || this.flushingSoon > -1) return;
    const mutations = this.pendingRecords();
    if (mutations.length) this.queue = [];

    const newSel = selectionFromDOM(view);
    if (newSel) view.dispatch(view.state.tr.setSelection(newSel));
    const sel = view.domSelectionRange();
    this.currentSelection.set(sel);
  }
}
