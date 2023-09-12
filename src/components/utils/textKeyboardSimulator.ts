/*
 * This simulates keypresses on an Icelandic layout keyboard. It is only
 * intended to test composition sessions which testing-library does not support
 * at this time. We should prefer using userEvent.type or userEvent.keyboard to
 * this where possible.
 *
 * See: https://github.com/testing-library/user-event/issues/1097
 */
import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Keyboard has been set up in the standard testing-library way in case we want
// to use it at some point when/if they support composition sessions:
// https://github.com/testing-library/user-event/blob/main/src/system/keyboard.ts
const LOC_LEFT = 1;
const LOC_RIGHT = 2;

interface KeyboardData {
  code: string;
  key: string;
  shiftKey?: boolean;
  composing?: boolean;
  location?: number;
}

const islKeyboard: KeyboardData[] = [
  ..."0123456789".split("").map((c) => ({ code: `Digit${c}`, key: c })),
  ...'=!"#$%&/()'
    .split("")
    .map((c, i) => ({ code: `Digit${i}`, key: c, shiftKey: true })),
  ..."abcdefghijklmnopqrstuvwxyz"
    .split("")
    .map((c) => ({ code: `Key${c.toUpperCase()}`, key: c })),
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    .split("")
    .map((c) => ({ code: `Key${c}`, key: c, shiftKey: true })),
  { code: "Minus", key: "ö", shiftKey: false },
  { code: "Minus", key: "Ö", shiftKey: true },
  { code: "BracketLeft", key: "ð", shiftKey: false },
  { code: "BracketLeft", key: "Ð", shiftKey: true },
  { code: "Semicolon", key: "æ", shiftKey: false },
  { code: "Semicolon", key: "Æ", shiftKey: true },
  { code: "Slash", key: "þ", shiftKey: false },
  { code: "Slash", key: "Þ", shiftKey: true },
  { code: "Backslash", key: "*", shiftKey: true },
  { code: "Backslash", key: "+", shiftKey: false },
  { code: "BracketRight", key: "'", shiftKey: false },
  { code: "BracketRight", key: "?", shiftKey: true },
  { code: "Comma", key: ",", shiftKey: false },
  { code: "Comma", key: ";", shiftKey: true },
  { code: "Equal", key: "-", shiftKey: false },
  { code: "Equal", key: "_", shiftKey: true },
  { code: "IntlBackslash", key: "<", shiftKey: false },
  { code: "IntlBackslash", key: ">", shiftKey: true },
  { code: "Period", key: ".", shiftKey: false },
  { code: "Period", key: ":", shiftKey: true },
  {
    code: "Quote",
    key: "´",
    shiftKey: false,
    composing: true,
  } /* key: 'Dead' */,
  {
    code: "Quote",
    key: "´",
    shiftKey: true,
    composing: true,
  } /* key: 'Dead' */,
  { code: "Space", key: " " },
  { code: "AltLeft", key: "Alt", location: LOC_LEFT },
  { code: "AltRight", key: "Alt", location: LOC_RIGHT },
  { code: "ShiftLeft", key: "Shift", location: LOC_LEFT },
  { code: "ShiftRight", key: "Shift", location: LOC_RIGHT },
  { code: "ControlLeft", key: "Control", location: LOC_LEFT },
  { code: "ControlRight", key: "Control", location: LOC_RIGHT },
  { code: "MetaLeft", key: "Meta", location: LOC_LEFT },
  { code: "MetaRight", key: "Meta", location: LOC_RIGHT },
  { code: "OSLeft", key: "OS", location: LOC_LEFT },
  { code: "OSRight", key: "OS", location: LOC_RIGHT },
  { code: "Tab", key: "Tab" },
  { code: "CapsLock", key: "CapsLock" },
  { code: "Backspace", key: "Backspace" },
  { code: "Enter", key: "Enter" },
  { code: "Escape", key: "Escape" },
  { code: "ArrowUp", key: "ArrowUp" },
  { code: "ArrowDown", key: "ArrowDown" },
  { code: "ArrowLeft", key: "ArrowLeft" },
  { code: "ArrowRight", key: "ArrowRight" },
  { code: "Home", key: "Home" },
  { code: "End", key: "End" },
  { code: "Delete", key: "Delete" },
  { code: "PageUp", key: "PageUp" },
  { code: "PageDown", key: "PageDown" },
  { code: "Fn", key: "Fn" },
  { code: "Symbol", key: "Symbol" },
  { code: "AltRight", key: "AltGraph" },
];

// a map of characters which will be split into composed keystrokes
const decomp: { [key: string]: string } = {
  á: "´a",
  é: "´e",
  í: "´i",
  ó: "´o",
  ú: "´u",
  ý: "´y",
};

function findAllTextNodes(list: Node[], ret: Node[] = []): Node[] {
  list.forEach((node) => {
    if (node.nodeType === 3) {
      ret.push(node);
    } else if (node.nodeType === 1) {
      findAllTextNodes([...node.childNodes], ret);
    }
  });
  return ret;
}

function isText(node: Node | null): node is Text {
  return node?.nodeType === Node.TEXT_NODE;
}

function getRangeOfPreviousChar(range0: Range): Range {
  const range = range0.cloneRange();
  let textNode =
    range.startContainer.nodeType === 3 ? (range.startContainer as Node) : null;
  if (range.startContainer.nodeType === 1) {
    const textNodes = findAllTextNodes(
      [...(range.startContainer as Node).childNodes].slice(0, range.startOffset)
    );
    textNode = textNodes.pop() as Node;
  }
  if (isText(textNode)) {
    range.setStart(textNode, textNode.data.length - 1);
  }
  return range;
}

export function pressKey(key: string) {
  const focusElm = document.activeElement as HTMLElement | null;
  if (!focusElm?.hasAttribute("contenteditable")) {
    return userEvent.keyboard(key);
  }

  const isLetter = /[a-záéíóúýþæðö]/i.test(key);
  const isShift = isLetter && key === key.toUpperCase();
  const seq = decomp[key.toLowerCase()];

  // use ranges for inserts?
  const sequence = [];
  if (isShift) {
    sequence.push({
      type: "keydown",
      code: "ShiftLeft",
      key: "Shift",
      shiftKey: isShift,
    } as KeyboardEvent);
  }
  if (seq) {
    // accent key
    const quote = {
      code: "Quote",
      key: "Dead",
      shiftKey: isShift,
    } as KeyboardData;
    sequence.push({ type: "keydown", ...quote } as KeyboardEvent);
    sequence.push({ type: "compositionstart" } as CompositionEvent);
    sequence.push({
      type: "compositionupdate",
      data: seq[0],
    } as CompositionEvent);
    sequence.push({ type: "input", isComposing: true });
    sequence.push({ type: "selectionchange" } as Event);
    sequence.push({ type: "keyup", ...quote } as KeyboardEvent);
    sequence.push({ type: "keypress", ...quote } as KeyboardEvent);
    // character
    const keyData = islKeyboard.find((d) => d.key === seq[1]) as KeyboardData;
    sequence.push({ type: "keydown", ...keyData } as KeyboardEvent);
    sequence.push({ type: "compositionupdate", data: key } as CompositionEvent);
    sequence.push({ type: "compositionend" } as CompositionEvent);
    sequence.push({ type: "input", isComposing: false });
    sequence.push({ type: "selectionchange" } as Event);
    sequence.push({ type: "keyup", ...keyData } as KeyboardEvent);
  } else {
    const keyData = islKeyboard.find((d) => d.key === key) || {
      key,
      code: "Unknown",
      shiftKey: isShift,
    };
    sequence.push({ type: "keydown", data: key, ...keyData });
    sequence.push({ type: "input", isComposing: false });
    sequence.push({ type: "selectionchange" } as Event);
    sequence.push({ type: "keyup", ...keyData } as KeyboardEvent);
  }
  if (isShift) {
    sequence.push({
      type: "keyup",
      code: "ShiftLeft",
      key: "Shift",
      shiftKey: isShift,
    } as KeyboardEvent);
  }

  let composeSession: boolean | null = null;
  let defaultPrevented = false;
  sequence.forEach((event) => {
    let e: KeyboardEvent | CompositionEvent | Event;
    const { type } = event;
    const { data } = event as CompositionEvent;
    if (type.startsWith("key") || type === "input") {
      e = new KeyboardEvent(type, {
        bubbles: true,
        cancelable: true,
        ...event,
      });
    } else if (type.startsWith("composition")) {
      e = new CompositionEvent(type, {
        bubbles: true,
        cancelable: true,
        ...event,
      });
    } else if (type === "selectionchange") {
      e = new Event("selectionchange", {
        bubbles: true,
        cancelable: true,
        ...event,
      });
    } else {
      throw new Error("Unsupported event " + type);
    }
    fireEvent(focusElm, e);
    // if default was prevented during keydown, we don't add chars for this cycle
    if (e.type === "keydown") {
      defaultPrevented = e.defaultPrevented;
    }
    if (data && !defaultPrevented) {
      // ensure we have a selection
      const selection = document.getSelection();
      if (!selection?.rangeCount) {
        selection?.selectAllChildren(focusElm);
        selection?.collapseToEnd();
      }
      let selectionRange = selection?.getRangeAt(0);
      // The test env does not seem to update selection with focus
      // in this case the selection points at <body>.
      // We can sidestep this by setting the caret to active element
      // if the selection container contains the active element:
      const cAC = selectionRange?.commonAncestorContainer;
      if (cAC?.contains(focusElm) && cAC !== focusElm) {
        selection?.selectAllChildren(focusElm);
        selection?.collapseToEnd();
        selectionRange = selection?.getRangeAt(0);
      }
      if (composeSession) {
        getRangeOfPreviousChar(selectionRange as Range).deleteContents();
      }
      if (type === "compositionupdate") {
        composeSession = true;
      }
      const charCode = data.charCodeAt(0);
      if (charCode === 8) {
        const r = selectionRange?.collapsed
          ? getRangeOfPreviousChar(selectionRange as Range)
          : selectionRange;
        r?.deleteContents();
        selection?.collapseToEnd();
      } else if (charCode > 31) {
        selectionRange?.deleteContents();
        selectionRange?.insertNode(document.createTextNode(data));
        selection?.collapseToEnd();
      }
    }
  });
  return;
}

export function simulateType(text: string): void {
  text.split("").forEach(pressKey);
}

export function selectAll(node: Node): void {
  const selection = document.getSelection();
  selection?.selectAllChildren(node);
}
