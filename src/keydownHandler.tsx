import { Command, EditorState } from "prosemirror-state";
import { EditorView as EditorViewPM } from "prosemirror-view";
import { base, keyName } from "w3c-keyname";

const mac =
  typeof navigator != "undefined"
    ? /Mac|iP(hone|[oa]d)/.test(navigator.platform)
    : false;
function normalizeKeyName(name: string) {
  const parts = name.split(/-(?!$)/);
  let result = parts[parts.length - 1]!;
  if (result == "Space") result = " ";
  const mods = parts.slice(0, parts.length - 1);
  let alt, ctrl, shift, meta;
  for (const mod of mods) {
    if (/^(cmd|meta|m)$/i.test(mod)) meta = true;
    else if (/^a(lt)?$/i.test(mod)) alt = true;
    else if (/^(c|ctrl|control)$/i.test(mod)) ctrl = true;
    else if (/^s(hift)?$/i.test(mod)) shift = true;
    else if (/^mod$/i.test(mod)) {
      if (mac) meta = true;
      else ctrl = true;
    } else throw new Error("Unrecognized modifier name: " + mod);
  }
  if (alt) result = "Alt-" + result;
  if (ctrl) result = "Ctrl-" + result;
  if (meta) result = "Meta-" + result;
  if (shift) result = "Shift-" + result;
  return result;
}
function normalize(map: { [key: string]: Command }) {
  const copy: { [key: string]: Command } = Object.create(null);
  for (const prop in map) copy[normalizeKeyName(prop)] = map[prop]!;
  return copy;
}
function modifiers(name: string, event: KeyboardEvent, shift = true) {
  if (event.altKey) name = "Alt-" + name;
  if (event.ctrlKey) name = "Ctrl-" + name;
  if (event.metaKey) name = "Meta-" + name;
  if (shift && event.shiftKey) name = "Shift-" + name;
  return name;
}
export function keydownHandler(bindings: {
  [key: string]: Command;
}): (
  state: EditorState,
  dispatch: EditorViewPM["dispatch"],
  event: KeyboardEvent
) => boolean {
  const map = normalize(bindings);
  return function (state, dispatch, event) {
    const name = keyName(event);
    const direct = map[modifiers(name, event)];
    let baseName;
    if (direct && direct(state, dispatch)) return true;
    // A character key
    if (name.length == 1 && name != " ") {
      if (event.shiftKey) {
        // In case the name was already modified by shift, try looking
        // it up without its shift modifier
        const noShift = map[modifiers(name, event, false)];
        if (noShift && noShift(state, dispatch)) return true;
      }
      if (
        (event.shiftKey ||
          event.altKey ||
          event.metaKey ||
          name.charCodeAt(0) > 127) &&
        (baseName = base[event.keyCode]) &&
        baseName != name
      ) {
        // Try falling back to the keyCode when there's a modifier
        // active or the character produced isn't ASCII, and our table
        // produces a different name from the the keyCode. See #668,
        // #1060
        const fromCode = map[modifiers(baseName, event)];
        if (fromCode && fromCode(state, dispatch)) return true;
      }
    }
    return false;
  };
}
