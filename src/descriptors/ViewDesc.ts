/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Fragment, Mark, Node, ParseRule } from "prosemirror-model";
import { DecorationSource } from "prosemirror-view";

import { ReactWidgetType } from "../decorations/ReactWidgetType.js";
import {
  DecorationInternal,
  DecorationSourceInternal,
  ReactWidgetDecoration,
} from "../prosemirror-internal/DecorationInternal.js";
import * as browser from "../prosemirror-internal/browser.js";
import {
  DOMNode,
  domIndex,
  isEquivalentPosition,
} from "../prosemirror-internal/dom.js";

export function sameOuterDeco(
  a: readonly DecorationInternal[],
  b: readonly DecorationInternal[]
) {
  if (a.length != b.length) return false;
  for (let i = 0; i < a.length; i++)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (!a[i]!.type.eq(b[i]!.type)) return false;
  return true;
}

const NOT_DIRTY = 0,
  CHILD_DIRTY = 1,
  CONTENT_DIRTY = 2,
  NODE_DIRTY = 3;

// Superclass for the various kinds of descriptions. Defines their
// basic structure and shared methods.
export class ViewDesc {
  dirty = NOT_DIRTY;
  node!: Node | null;

  // The size of the content represented by this desc.
  public size: number;

  // For block nodes, this represents the space taken up by their
  // start/end tokens.
  public border: number;

  constructor(
    public parent: ViewDesc | undefined,
    public children: ViewDesc[],
    public dom: DOMNode,
    // This is the node that holds the child views. It may be null for
    // descs that don't have children.
    public contentDOM: HTMLElement | null,
    private domToDesc: Map<DOMNode, ViewDesc>
  ) {
    this.size = this.children.reduce((acc, { size }) => acc + size, 0);
    this.border = 0;
  }

  // Used to check whether a given description corresponds to a
  // widget/mark/node.
  matchesWidget(_widget: DecorationInternal) {
    return false;
  }
  matchesMark(_mark: Mark) {
    return false;
  }
  matchesNode(
    _node: Node,
    _outerDeco: readonly DecorationInternal[],
    _innerDeco: DecorationSource
  ) {
    return false;
  }
  matchesHack(_nodeName: string) {
    return false;
  }

  // When parsing in-editor content (in domchange.js), we allow
  // descriptions to determine the parse rules that should be used to
  // parse them.
  parseRule(): ParseRule | null {
    return null;
  }

  // Used by the editor's event handler to ignore events that come
  // from certain descs.
  stopEvent(_event: Event) {
    return false;
  }

  posBeforeChild(child: ViewDesc): number {
    for (let i = 0, pos = this.posAtStart; ; i++) {
      const cur = this.children[i]!;
      if (cur == child) return pos;
      pos += cur.size;
    }
  }

  get posBefore() {
    return this.parent?.posBeforeChild(this) ?? 0;
  }

  get posAtStart() {
    return this.parent ? this.parent?.posBeforeChild(this) + this.border : 0;
  }

  get posAfter() {
    return this.posBefore + this.size;
  }

  get posAtEnd() {
    return this.posAtStart + this.size - 2 * this.border;
  }

  localPosFromDOM(dom: DOMNode, offset: number, bias: number): number {
    // If the DOM position is in the content, use the child desc after
    // it to figure out a position.
    if (
      this.contentDOM &&
      this.contentDOM.contains(dom.nodeType == 1 ? dom : dom.parentNode)
    ) {
      if (bias < 0) {
        let domBefore: DOMNode | undefined | null;
        let desc: ViewDesc | undefined;
        if (dom == this.contentDOM) {
          domBefore = dom.childNodes[offset - 1];
        } else {
          while (dom.parentNode != this.contentDOM) dom = dom.parentNode!;
          domBefore = dom.previousSibling;
        }
        while (
          domBefore &&
          !((desc = this.domToDesc.get(domBefore)) && desc.parent == this)
        )
          domBefore = domBefore.previousSibling;
        return domBefore
          ? this.posBeforeChild(desc!) + desc!.size
          : this.posAtStart;
      } else {
        let domAfter, desc: ViewDesc | undefined;
        if (dom == this.contentDOM) {
          domAfter = dom.childNodes[offset];
        } else {
          while (dom.parentNode != this.contentDOM) dom = dom.parentNode!;
          domAfter = dom.nextSibling;
        }
        while (
          domAfter &&
          !((desc = this.domToDesc.get(domAfter)) && desc.parent == this)
        )
          domAfter = domAfter.nextSibling;
        return domAfter ? this.posBeforeChild(desc!) : this.posAtEnd;
      }
    }
    // Otherwise, use various heuristics, falling back on the bias
    // parameter, to determine whether to return the position at the
    // start or at the end of this view desc.
    let atEnd;
    if (dom == this.dom && this.contentDOM) {
      atEnd = offset > domIndex(this.contentDOM);
    } else if (
      this.contentDOM &&
      this.contentDOM != this.dom &&
      this.dom.contains(this.contentDOM)
    ) {
      atEnd = dom.compareDocumentPosition(this.contentDOM) & 2;
    } else if (this.dom.firstChild) {
      if (offset == 0)
        for (let search = dom; ; search = search.parentNode!) {
          if (search == this.dom) {
            atEnd = false;
            break;
          }
          if (search.previousSibling) break;
        }
      if (atEnd == null && offset == dom.childNodes.length)
        for (let search = dom; ; search = search.parentNode!) {
          if (search == this.dom) {
            atEnd = true;
            break;
          }
          if (search.nextSibling) break;
        }
    }
    return (atEnd == null ? bias > 0 : atEnd) ? this.posAtEnd : this.posAtStart;
  }

  // Scan up the dom finding the first desc that is a descendant of
  // this one.
  nearestDesc(dom: DOMNode): ViewDesc | undefined;
  nearestDesc(dom: DOMNode, onlyNodes: true): NodeViewDesc | undefined;
  nearestDesc(dom: DOMNode, onlyNodes = false) {
    for (
      let first = true, cur: DOMNode | null = dom;
      cur;
      cur = cur.parentNode
    ) {
      const desc = this.getDesc(cur);
      let nodeDOM: DOMNode;
      if (desc && (!onlyNodes || desc.node)) {
        // If dom is outside of this desc's nodeDOM, don't count it.
        if (
          first &&
          (nodeDOM = (desc as NodeViewDesc).nodeDOM) &&
          !(nodeDOM.nodeType == 1
            ? nodeDOM.contains(dom.nodeType == 1 ? dom : dom.parentNode)
            : nodeDOM == dom)
        )
          first = false;
        else return desc;
      }
    }
    return undefined;
  }

  getDesc(dom: DOMNode) {
    const desc = this.domToDesc.get(dom);
    for (let cur: ViewDesc | undefined = desc; cur; cur = cur.parent)
      if (cur == this) return desc;
    return undefined;
  }

  posFromDOM(dom: DOMNode, offset: number, bias: number) {
    for (let scan: DOMNode | null = dom; scan; scan = scan.parentNode) {
      const desc = this.getDesc(scan);
      if (desc) return desc.localPosFromDOM(dom, offset, bias);
    }
    return -1;
  }

  // Find the desc for the node after the given pos, if any. (When a
  // parent node overrode rendering, there might not be one.)
  descAt(pos: number): ViewDesc | undefined {
    let offset = 0;
    for (const child of this.children) {
      const end = offset + child.size;
      if (offset == pos && end != offset) {
        let desc: ViewDesc | undefined = child;
        while (!child.border && child.children.length) desc = child.children[0];
        return desc;
      }
      if (pos < end) return child.descAt(pos - offset - child.border);
      offset = end;
    }
    return undefined;
  }

  domFromPos(
    pos: number,
    side: number
  ): { node: DOMNode; offset: number; atom?: number } {
    if (!this.contentDOM) return { node: this.dom, offset: 0, atom: pos + 1 };
    // First find the position in the child array
    let i = 0,
      offset = 0;
    for (let curPos = 0; i < this.children.length; i++) {
      const child = this.children[i]!,
        end = curPos + child.size;
      if (end > pos || child instanceof TrailingHackViewDesc) {
        offset = pos - curPos;
        break;
      }
      curPos = end;
    }
    // If this points into the middle of a child, call through
    if (offset)
      return this.children[i]!.domFromPos(
        offset - this.children[i]!.border,
        side
      );
    // Go back if there were any zero-length widgets with side >= 0 before this point
    for (
      let prev;
      i &&
      !(prev = this.children[i - 1]!).size &&
      prev instanceof WidgetViewDesc &&
      prev.side >= 0;
      i--
    ) {
      // Just iterate
    }
    // Scan towards the first useable node
    if (side <= 0) {
      let prev,
        enter = true;
      for (; ; i--, enter = false) {
        prev = i ? this.children[i - 1] : null;
        if (!prev || prev.dom.parentNode == this.contentDOM) break;
      }
      if (prev && side && enter && !prev.border && !prev.domAtom)
        return prev.domFromPos(prev.size, side);
      return {
        node: this.contentDOM,
        offset: prev ? domIndex(prev.dom) + 1 : 0,
      };
    } else {
      let next,
        enter = true;
      for (; ; i++, enter = false) {
        next = i < this.children.length ? this.children[i] : null;
        if (!next || next.dom.parentNode == this.contentDOM) break;
      }
      if (next && enter && !next.border && !next.domAtom)
        return next.domFromPos(0, side);
      return {
        node: this.contentDOM,
        offset: next ? domIndex(next.dom) : this.contentDOM.childNodes.length,
      };
    }
  }

  // Used to find a DOM range in a single parent for a given changed
  // range.
  parseRange(
    from: number,
    to: number,
    base = 0
  ): {
    node: DOMNode;
    from: number;
    to: number;
    fromOffset: number;
    toOffset: number;
  } {
    if (this.children.length == 0)
      return {
        node: this.contentDOM!,
        from,
        to,
        fromOffset: 0,
        toOffset: this.contentDOM!.childNodes.length,
      };

    let fromOffset = -1,
      toOffset = -1;
    for (let offset = base, i = 0; ; i++) {
      const child = this.children[i]!,
        end = offset + child.size;
      if (fromOffset == -1 && from <= end) {
        const childBase = offset + child.border;
        // FIXME maybe descend mark views to parse a narrower range?
        if (
          from >= childBase &&
          to <= end - child.border &&
          child.node &&
          child.contentDOM &&
          this.contentDOM!.contains(child.contentDOM)
        )
          return child.parseRange(from, to, childBase);

        from = offset;
        for (let j = i; j > 0; j--) {
          const prev = this.children[j - 1]!;
          if (
            prev.size &&
            prev.dom.parentNode == this.contentDOM &&
            !prev.emptyChildAt(1)
          ) {
            fromOffset = domIndex(prev.dom) + 1;
            break;
          }
          from -= prev.size;
        }
        if (fromOffset == -1) fromOffset = 0;
      }
      if (fromOffset > -1 && (end > to || i == this.children.length - 1)) {
        to = end;
        for (let j = i + 1; j < this.children.length; j++) {
          const next = this.children[j]!;
          if (
            next.size &&
            next.dom.parentNode == this.contentDOM &&
            !next.emptyChildAt(-1)
          ) {
            toOffset = domIndex(next.dom);
            break;
          }
          to += next.size;
        }
        if (toOffset == -1) toOffset = this.contentDOM!.childNodes.length;
        break;
      }
      offset = end;
    }
    return { node: this.contentDOM!, from, to, fromOffset, toOffset };
  }

  emptyChildAt(side: number): boolean {
    if (this.border || !this.contentDOM || !this.children.length) return false;
    const child = this.children[side < 0 ? 0 : this.children.length - 1]!;
    return child.size == 0 || child.emptyChildAt(side);
  }

  domAfterPos(pos: number): DOMNode {
    const { node, offset } = this.domFromPos(pos, 0);
    if (node.nodeType != 1 || offset == node.childNodes.length)
      throw new RangeError("No node after pos " + pos);
    return node.childNodes[offset]!;
  }

  // View descs are responsible for setting any selection that falls
  // entirely inside of them, so that custom implementations can do
  // custom things with the selection. Note that this falls apart when
  // a selection starts in such a node and ends in another, in which
  // case we just use whatever domFromPos produces as a best effort.
  setSelection(
    anchor: number,
    head: number,
    root: Document | ShadowRoot,
    force = false
  ): void {
    // If the selection falls entirely in a child, give it to that child
    const from = Math.min(anchor, head),
      to = Math.max(anchor, head);
    for (let i = 0, offset = 0; i < this.children.length; i++) {
      const child = this.children[i]!,
        end = offset + child.size;
      if (from > offset && to < end)
        return child.setSelection(
          anchor - offset - child.border,
          head - offset - child.border,
          root,
          force
        );
      offset = end;
    }

    let anchorDOM = this.domFromPos(anchor, anchor ? -1 : 1);
    let headDOM =
      head == anchor ? anchorDOM : this.domFromPos(head, head ? -1 : 1);
    const domSel = (root as Document).getSelection()!;

    let brKludge = false;
    // On Firefox, using Selection.collapse to put the cursor after a
    // BR node for some reason doesn't always work (#1073). On Safari,
    // the cursor sometimes inexplicable visually lags behind its
    // reported position in such situations (#1092).
    if ((browser.gecko || browser.safari) && anchor == head) {
      const { node, offset } = anchorDOM;
      if (node.nodeType == 3) {
        brKludge = !!(offset && node.nodeValue![offset - 1] == "\n");
        // Issue #1128
        if (brKludge && offset == node.nodeValue!.length) {
          for (
            let scan: DOMNode | null = node, after;
            scan;
            scan = scan.parentNode
          ) {
            if ((after = scan.nextSibling)) {
              if (after.nodeName == "BR")
                anchorDOM = headDOM = {
                  node: after.parentNode!,
                  offset: domIndex(after) + 1,
                };
              break;
            }
            const desc = this.domToDesc.get(scan);
            if (desc && desc.node && desc.node.isBlock) break;
          }
        }
      } else {
        const prev = node.childNodes[offset - 1];
        brKludge =
          (prev &&
            (prev.nodeName == "BR" ||
              (prev as HTMLElement).contentEditable == "false")) ??
          false;
      }
    }
    // Firefox can act strangely when the selection is in front of an
    // uneditable node. See #1163 and https://bugzilla.mozilla.org/show_bug.cgi?id=1709536
    if (
      browser.gecko &&
      domSel.focusNode &&
      domSel.focusNode != headDOM.node &&
      domSel.focusNode.nodeType == 1
    ) {
      const after = domSel.focusNode.childNodes[domSel.focusOffset];
      if (after && (after as HTMLElement).contentEditable == "false")
        force = true;
    }

    if (
      !(force || (brKludge && browser.safari)) &&
      isEquivalentPosition(
        anchorDOM.node,
        anchorDOM.offset,
        domSel.anchorNode!,
        domSel.anchorOffset
      ) &&
      isEquivalentPosition(
        headDOM.node,
        headDOM.offset,
        domSel.focusNode!,
        domSel.focusOffset
      )
    )
      return;

    // Selection.extend can be used to create an 'inverted' selection
    // (one where the focus is before the anchor), but not all
    // browsers support it yet.
    let domSelExtended = false;
    if ((domSel.extend || anchor == head) && !brKludge) {
      domSel.collapse(anchorDOM.node, anchorDOM.offset);
      try {
        if (anchor != head) domSel.extend(headDOM.node, headDOM.offset);
        domSelExtended = true;
      } catch (_) {
        // In some cases with Chrome the selection is empty after calling
        // collapse, even when it should be valid. This appears to be a bug, but
        // it is difficult to isolate. If this happens fallback to the old path
        // without using extend.
        // Similarly, this could crash on Safari if the editor is hidden, and
        // there was no selection.
      }
    }
    if (!domSelExtended) {
      if (anchor > head) {
        const tmp = anchorDOM;
        anchorDOM = headDOM;
        headDOM = tmp;
      }
      const range = document.createRange();
      range.setEnd(headDOM.node, headDOM.offset);
      range.setStart(anchorDOM.node, anchorDOM.offset);
      domSel.removeAllRanges();
      domSel.addRange(range);
    }
  }

  ignoreMutation(mutation: MutationRecord): boolean {
    return (
      !this.contentDOM &&
      (mutation.type as MutationRecordType | "selection") != "selection"
    );
  }

  get contentLost() {
    return (
      this.contentDOM &&
      this.contentDOM != this.dom &&
      !this.dom.contains(this.contentDOM)
    );
  }

  // Remove a subtree of the element tree that has been touched
  // by a DOM change, so that the next update will redraw it.
  markDirty(from: number, to: number) {
    for (let offset = 0, i = 0; i < this.children.length; i++) {
      const child = this.children[i]!,
        end = offset + child.size;
      if (
        offset == end ? from <= end && to >= offset : from < end && to > offset
      ) {
        const startInside = offset + child.border,
          endInside = end - child.border;
        if (from >= startInside && to <= endInside) {
          this.dirty =
            from == offset || to == end ? CONTENT_DIRTY : CHILD_DIRTY;
          if (
            from == startInside &&
            to == endInside &&
            (child.contentLost || child.dom.parentNode != this.contentDOM)
          )
            child.dirty = NODE_DIRTY;
          else child.markDirty(from - startInside, to - startInside);
          return;
        } else {
          child.dirty =
            child.dom == child.contentDOM &&
            child.dom.parentNode == this.contentDOM &&
            !child.children.length
              ? CONTENT_DIRTY
              : NODE_DIRTY;
        }
      }
      offset = end;
    }
    this.dirty = CONTENT_DIRTY;
  }

  markParentsDirty() {
    let level = 1;
    for (let node = this.parent; node; node = node.parent, level++) {
      const dirty = level == 1 ? CONTENT_DIRTY : CHILD_DIRTY;
      if (node.dirty < dirty) node.dirty = dirty;
    }
  }

  get domAtom() {
    return false;
  }

  get ignoreForCoords() {
    return false;
  }
}

// A dummy desc used to tag trailing BR or IMG nodes created to work
// around contentEditable terribleness.
export class TrailingHackViewDesc extends ViewDesc {
  parseRule() {
    return { ignore: true };
  }
  matchesHack(nodeName: string) {
    return this.dirty == NOT_DIRTY && this.dom.nodeName == nodeName;
  }
  get domAtom() {
    return true;
  }
  get ignoreForCoords() {
    return this.dom.nodeName == "IMG";
  }
}

// A widget desc represents a widget decoration, which is a DOM node
// drawn between the document nodes.
export class WidgetViewDesc extends ViewDesc {
  constructor(
    parent: ViewDesc | undefined,
    readonly widget: ReactWidgetDecoration,
    dom: DOMNode,
    domToDesc: Map<DOMNode, ViewDesc>
  ) {
    super(parent, [], dom, null, domToDesc);
    this.widget = widget;
  }

  matchesWidget(widget: ReactWidgetDecoration) {
    return this.dirty == NOT_DIRTY && widget.type.eq(this.widget.type);
  }

  parseRule() {
    return { ignore: true };
  }

  stopEvent(event: Event) {
    const stop = this.widget.spec.stopEvent;
    return stop ? stop(event) : false;
  }

  ignoreMutation(mutation: MutationRecord) {
    return (
      (mutation.type as MutationRecordType | "selection") != "selection" ||
      this.widget.spec.ignoreSelection
    );
  }

  get domAtom() {
    return true;
  }

  get side() {
    return this.widget.type.side;
  }
}

// A mark desc represents a mark. May have multiple children,
// depending on how the mark is split. Note that marks are drawn using
// a fixed nesting order, for simplicity and predictability, so in
// some cases they will be split more often than would appear
// necessary.
export class MarkViewDesc extends ViewDesc {
  constructor(
    parent: ViewDesc | undefined,
    children: ViewDesc[],
    readonly mark: Mark,
    dom: DOMNode,
    contentDOM: HTMLElement,
    domToDesc: Map<DOMNode, ViewDesc>
  ) {
    super(parent, children, dom, contentDOM, domToDesc);
  }

  parseRule(): ParseRule | null {
    if (this.dirty & NODE_DIRTY || this.mark.type.spec.reparseInView)
      return null;
    return {
      mark: this.mark.type.name,
      attrs: this.mark.attrs,
      contentElement: this.contentDOM!,
    };
  }

  matchesMark(mark: Mark) {
    return this.dirty != NODE_DIRTY && this.mark.eq(mark);
  }

  markDirty(from: number, to: number) {
    super.markDirty(from, to);
    // Move dirty info to nearest node view
    if (this.dirty != NOT_DIRTY) {
      let parent = this.parent!;
      while (!parent.node) parent = parent.parent!;
      if (parent.dirty < this.dirty) parent.dirty = this.dirty;
      this.dirty = NOT_DIRTY;
    }
  }

  // slice(from: number, to: number, view: EditorView) {
  //   const copy = MarkViewDesc.create(this.parent!, this.mark, true, view);
  //   let nodes = this.children,
  //     size = this.size;
  //   if (to < size) nodes = replaceNodes(nodes, to, size, view);
  //   if (from > 0) nodes = replaceNodes(nodes, 0, from, view);
  //   for (let i = 0; i < nodes.length; i++) nodes[i].parent = copy;
  //   copy.children = nodes;
  //   return copy;
  // }
}

// Node view descs are the main, most common type of view desc, and
// correspond to an actual node in the document. Unlike mark descs,
// they populate their child array themselves.
export class NodeViewDesc extends ViewDesc {
  public border: number;

  constructor(
    parent: ViewDesc | undefined,
    children: ViewDesc[],
    public node: Node,
    public outerDeco: readonly DecorationInternal[],
    public innerDeco: DecorationSource,
    dom: DOMNode,
    contentDOM: HTMLElement | null,
    readonly nodeDOM: DOMNode,

    domToDesc: Map<DOMNode, ViewDesc>
  ) {
    super(parent, children, dom, contentDOM, domToDesc);
    this.size = this.node.nodeSize;
    this.border = this.node.isLeaf ? 0 : 1;
  }

  // By default, a node is rendered using the `toDOM` method from the
  // node type spec. But client code can use the `nodeViews` spec to
  // supply a custom node view, which can influence various aspects of
  // the way the node works.
  //
  // (Using subclassing for this was intentionally decided against,
  // since it'd require exposing a whole slew of finicky
  // implementation details to the user code that they probably will
  // never need.)
  // static create(
  //   parent: ViewDesc | undefined,
  //   node: Node,
  //   outerDeco: readonly DecorationInternal[],
  //   innerDeco: DecorationSource,
  //   view: EditorView,
  //   pos: number
  // ) {
  //   let custom = view.nodeViews[node.type.name],
  //     descObj: ViewDesc;
  //   const spec: NodeView | undefined =
  //     custom &&
  //     (custom as any)(
  //       node,
  //       view,
  //       () => {
  //         // (This is a function that allows the custom view to find its
  //         // own position)
  //         if (!descObj) return pos;
  //         if (descObj.parent) return descObj.parent.posBeforeChild(descObj);
  //       },
  //       outerDeco,
  //       innerDeco
  //     );

  //   let dom = spec && spec.dom,
  //     contentDOM = spec && spec.contentDOM;
  //   if (node.isText) {
  //     if (!dom) dom = document.createTextNode(node.text!);
  //     else if (dom.nodeType != 3)
  //       throw new RangeError("Text must be rendered as a DOM text node");
  //   } else if (!dom) {
  //     ({ dom, contentDOM } = DOMSerializer.renderSpec(
  //       document,
  //       node.type.spec.toDOM!(node)
  //     ));
  //   }
  //   if (!contentDOM && !node.isText && dom.nodeName != "BR") {
  //     // Chrome gets confused by <br contenteditable=false>
  //     if (!(dom as HTMLElement).hasAttribute("contenteditable"))
  //       (dom as HTMLElement).contentEditable = "false";
  //     if (node.type.spec.draggable) (dom as HTMLElement).draggable = true;
  //   }

  //   const nodeDOM = dom;
  //   dom = applyOuterDeco(dom, outerDeco, node);

  //   if (spec)
  //     return (descObj = new CustomNodeViewDesc(
  //       parent,
  //       node,
  //       outerDeco,
  //       innerDeco,
  //       dom,
  //       contentDOM || null,
  //       nodeDOM,
  //       spec,
  //       view,
  //       pos + 1
  //     ));
  //   else if (node.isText)
  //     return new TextViewDesc(
  //       parent,
  //       node,
  //       outerDeco,
  //       innerDeco,
  //       dom,
  //       nodeDOM,
  //       view
  //     );
  //   else
  //     return new NodeViewDesc(
  //       parent,
  //       node,
  //       outerDeco,
  //       innerDeco,
  //       dom,
  //       contentDOM || null,
  //       nodeDOM,
  //       view,
  //       pos + 1
  //     );
  // }

  parseRule(): ParseRule | null {
    // Experimental kludge to allow opt-in re-parsing of nodes
    if (this.node.type.spec.reparseInView) return null;
    // FIXME the assumption that this can always return the current
    // attrs means that if the user somehow manages to change the
    // attrs in the dom, that won't be picked up. Not entirely sure
    // whether this is a problem
    const rule: ParseRule = {
      node: this.node.type.name,
      attrs: this.node.attrs,
    };
    if (this.node.type.whitespace == "pre") rule.preserveWhitespace = "full";
    if (!this.contentDOM) {
      rule.getContent = () => this.node.content;
    } else if (!this.contentLost) {
      rule.contentElement = this.contentDOM;
    } else {
      // Chrome likes to randomly recreate parent nodes when
      // backspacing things. When that happens, this tries to find the
      // new parent.
      for (let i = this.children.length - 1; i >= 0; i--) {
        const child = this.children[i]!;
        if (this.dom.contains(child.dom.parentNode)) {
          rule.contentElement = child.dom.parentNode as HTMLElement;
          break;
        }
      }
      if (!rule.contentElement) rule.getContent = () => Fragment.empty;
    }
    return rule;
  }

  matchesNode(
    node: Node,
    outerDeco: readonly DecorationInternal[],
    innerDeco: DecorationSourceInternal
  ): boolean {
    return (
      this.dirty == NOT_DIRTY &&
      node.eq(this.node) &&
      sameOuterDeco(outerDeco, this.outerDeco) &&
      innerDeco.eq(this.innerDeco)
    );
  }

  // Mark this node as being the selected node.
  selectNode() {
    if (this.nodeDOM.nodeType == 1)
      (this.nodeDOM as HTMLElement).classList.add("ProseMirror-selectednode");
    if (this.contentDOM || !this.node.type.spec.draggable)
      (this.dom as HTMLElement).draggable = true;
  }

  // Remove selected node marking from this node.
  deselectNode() {
    if (this.nodeDOM.nodeType == 1)
      (this.nodeDOM as HTMLElement).classList.remove(
        "ProseMirror-selectednode"
      );
    if (this.contentDOM || !this.node.type.spec.draggable)
      (this.dom as HTMLElement).removeAttribute("draggable");
  }

  get domAtom() {
    return this.node.isAtom;
  }
}

export class TextViewDesc extends NodeViewDesc {
  constructor(
    parent: ViewDesc | undefined,
    public node: Node,
    public outerDeco: readonly DecorationInternal[],
    public innerDeco: DecorationSource,
    dom: DOMNode,
    readonly nodeDOM: DOMNode,

    domToDesc: Map<DOMNode, ViewDesc>
  ) {
    super(
      parent,
      [],
      node,
      outerDeco,
      innerDeco,
      dom,
      null,
      nodeDOM,
      domToDesc
    );

    this.size = this.node.text!.length;
  }

  parseRule(): ParseRule {
    let skip = this.nodeDOM.parentNode;
    while (
      skip &&
      skip != this.dom &&
      !(skip as ParentNode & { pmIsDeco: boolean }).pmIsDeco
    )
      skip = skip.parentNode;
    return { skip: !!skip || true };
  }

  inParent() {
    const parentDOM = this.parent!.contentDOM;
    for (let n: DOMNode | null = this.nodeDOM; n; n = n.parentNode)
      if (n == parentDOM) return true;
    return false;
  }

  domFromPos(pos: number) {
    return { node: this.nodeDOM, offset: pos };
  }

  localPosFromDOM(dom: DOMNode, offset: number, bias: number) {
    if (dom == this.nodeDOM)
      return this.posAtStart + Math.min(offset, this.node.text!.length);
    return super.localPosFromDOM(dom, offset, bias);
  }

  ignoreMutation(mutation: MutationRecord) {
    return (
      mutation.type != "characterData" &&
      (mutation.type as MutationRecordType | "selection") != "selection"
    );
  }

  markDirty(from: number, to: number) {
    super.markDirty(from, to);
    if (
      this.dom != this.nodeDOM &&
      (from == 0 || to == this.nodeDOM.nodeValue!.length)
    )
      this.dirty = NODE_DIRTY;
  }

  get domAtom() {
    return false;
  }
}

function compareSide(a: DecorationInternal, b: DecorationInternal) {
  return (a.type as ReactWidgetType).side - (b.type as ReactWidgetType).side;
}

// This function abstracts iterating over the nodes and decorations in
// a fragment. Calls `onNode` for each node, with its local and child
// decorations. Splits text nodes when there is a decoration starting
// or ending inside of them. Calls `onWidget` for each widget.
export function iterDeco(
  parent: Node,
  deco: DecorationSourceInternal,
  // Callbacks have been slightly modified to pass
  // the offset, so that we can pass the position as
  // a prop to components
  onWidget: (
    widget: DecorationInternal,
    offset: number,
    index: number,
    insideNode: boolean
  ) => void,
  onNode: (
    node: Node,
    outerDeco: readonly DecorationInternal[],
    innerDeco: DecorationSourceInternal,
    offset: number,
    index: number
  ) => void
) {
  const locals = deco.locals(parent);
  let offset = 0;
  // Simple, cheap variant for when there are no local decorations
  if (locals.length == 0) {
    for (let i = 0; i < parent.childCount; i++) {
      const child = parent.child(i);
      onNode(child, locals, deco.forChild(offset, child), offset, i);
      offset += child.nodeSize;
    }
    return;
  }

  let decoIndex = 0;
  const active = [];
  let restNode = null;
  for (let parentIndex = 0; ; ) {
    if (decoIndex < locals.length && locals[decoIndex]!.to == offset) {
      const widget = locals[decoIndex++]!;
      let widgets;
      while (decoIndex < locals.length && locals[decoIndex]!.to == offset)
        (widgets || (widgets = [widget])).push(locals[decoIndex++]!);
      if (widgets) {
        widgets.sort(compareSide);
        for (let i = 0; i < widgets.length; i++)
          onWidget(widgets[i]!, offset, parentIndex, !!restNode);
      } else {
        onWidget(widget, offset, parentIndex, !!restNode);
      }
    }

    let child, index;
    if (restNode) {
      index = -1;
      child = restNode;
      restNode = null;
    } else if (parentIndex < parent.childCount) {
      index = parentIndex;
      child = parent.child(parentIndex++);
    } else {
      break;
    }

    for (let i = 0; i < active.length; i++)
      if (active[i]!.to <= offset) active.splice(i--, 1);
    while (
      decoIndex < locals.length &&
      locals[decoIndex]!.from <= offset &&
      locals[decoIndex]!.to > offset
    )
      active.push(locals[decoIndex++]!);

    let end = offset + child.nodeSize;
    if (child.isText) {
      let cutAt = end;
      if (decoIndex < locals.length && locals[decoIndex]!.from < cutAt)
        cutAt = locals[decoIndex]!.from;
      for (let i = 0; i < active.length; i++)
        if (active[i]!.to < cutAt) cutAt = active[i]!.to;
      if (cutAt < end) {
        restNode = child.cut(cutAt - offset);
        child = child.cut(0, cutAt - offset);
        end = cutAt;
        index = -1;
      }
    }

    const outerDeco =
      child.isInline && !child.isLeaf
        ? active.filter((d) => !d.inline)
        : active.slice();
    onNode(child, outerDeco, deco.forChild(offset, child), offset, index);
    offset = end;
  }
}
