import React from "react";
import type { ReactNode } from "react";

import { EditorContext } from "../contexts/EditorContext.js";
import { useEditorView } from "../hooks/useEditorView.js";
import type { UseEditorViewOptions } from "../hooks/useEditorView.js";

export interface EditorProps extends UseEditorViewOptions {
  mount: HTMLElement | null;
  children?: ReactNode | null;
}

export function Editor({ mount, children, ...options }: EditorProps) {
  const value = useEditorView(mount, options);
  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  );
}
