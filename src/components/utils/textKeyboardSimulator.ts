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

const islKeyboard = [
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
const decomp = {
  á: "´a",
  é: "´e",
  í: "´i",
  ó: "´o",
  ú: "´u",
  ý: "´y",
};

function findAllTextNodes(list: Node[], ret: Node[] = []) {
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

function getRangeOfPreviousChar(range0: Range | undefined) {
  const range = range0?.cloneRange();
  let textNode =
    range?.startContainer.nodeType === 3 ? range?.startContainer : null;
  if (range?.startContainer.nodeType === 1) {
    const textNodes = findAllTextNodes(
      [...(range?.startContainer.childNodes || [])].slice(0, range?.startOffset)
    );
    textNode = textNodes.pop() || null;
  }
  if (isText(textNode)) {
    range?.setStart(textNode, textNode?.data.length - 1);
  }
  return range;
}

export function pressKey(key: string) {
  const focusElm = document.activeElement;
  if (!focusElm?.hasAttribute("contenteditable")) {
    return userEvent.keyboard(key);
  }

  const isLetter = /[a-záéíóúýþæðö]/i.test(key);
  const isShift = isLetter && key === key.toUpperCase();
  const seq = decomp[key.toLowerCase() as keyof typeof decomp];

  // use ranges for inserts?
  const sequence = [];
  if (isShift) {
    sequence.push({
      type: "keydown",
      code: "ShiftLeft",
      key: "Shift",
      shiftKey: isShift,
    });
  }
  if (seq) {
    // accent key
    const quote = { code: "Quote", key: "Dead", shiftKey: isShift };
    sequence.push({ type: "keydown", ...quote });
    sequence.push({ type: "compositionstart" });
    sequence.push({ type: "compositionupdate", data: seq[0] });
    sequence.push({ type: "input", isComposing: true });
    sequence.push({ type: "selectionchange" });
    sequence.push({ type: "keyup", ...quote });
    sequence.push({ type: "keypress", ...quote });
    // character
    const keyData = islKeyboard.find((d) => d.key === seq[1]);
    sequence.push({ type: "keydown", ...keyData });
    sequence.push({ type: "compositionupdate", data: key });
    sequence.push({ type: "compositionend" });
    sequence.push({ type: "input", isComposing: false });
    sequence.push({ type: "selectionchange" });
    sequence.push({ type: "keyup", ...keyData });
  } else {
    const keyData = islKeyboard.find((d) => d.key === key) || {
      key,
      code: "Unknown",
      shiftKey: isShift,
    };
    sequence.push({ type: "keydown", data: key, ...keyData });
    sequence.push({ type: "input", isComposing: false });
    sequence.push({ type: "selectionchange" });
    sequence.push({ type: "keyup", ...keyData });
  }
  if (isShift) {
    sequence.push({
      type: "keyup",
      code: "ShiftLeft",
      key: "Shift",
      shiftKey: isShift,
    });
  }

  let composeSession = false;
  let defaultPrevented = false;
  sequence.forEach((event) => {
    let e;
    const { type, data } = event;
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
        getRangeOfPreviousChar(selectionRange)?.deleteContents();
      }
      if (type === "compositionupdate") {
        composeSession = false;
      }
      const charCode = data.charCodeAt(0);
      if (charCode === 8) {
        const r = selection?.isCollapsed
          ? getRangeOfPreviousChar(selectionRange)
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
}

export function simulateType(text: string) {
  text.split("").forEach(pressKey);
}

export function selectAll(node: Node) {
  const selection = document.getSelection();
  selection?.selectAllChildren(node);
}
