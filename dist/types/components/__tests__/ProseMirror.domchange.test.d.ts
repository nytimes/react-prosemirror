/**
 * @fileoverview
 * This file tests that prosemirror-view's DOMObserver works correctly
 * in conjunction with React ProseMirror.
 *
 * @important
 * DOMObserver relies on a MutationObserver. The MutationObserver callback
 * seems to get queued as a microtask; it will not run until after all
 * synchronous code in a test has completed. This is why we manually call
 * flush(view) in each test to ensure that the mutation records have been
 * flushed.
 *
 * HOWEVER! If you use an awaited statement after changing the DOM, the
 * MutationObserver WILL run. This means that a sequence of DOM changes
 * that you want to be staged and detected as a single change may be
 * detected and processed in multiple separate phases, which can lead to
 * unexpected results. Unsure that you only have synchronous code between
 * your first DOM change and your eventual call to flush(view) to avoid this.
 */
export {};
