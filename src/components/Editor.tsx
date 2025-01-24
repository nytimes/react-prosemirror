import React from "react";
import type { ReactNode } from "react";

import { EditorContext } from "../contexts/EditorContext.js";
import { useEditorView } from "../hooks/useEditorView.js";
import type { UseEditorViewOptions } from "../hooks/useEditorView.js";
import { useNodeViews } from "../hooks/useNodeViews.js";

export interface EditorProps extends UseEditorViewOptions {
  mount: HTMLElement | null;
  children?: ReactNode | null;
}

export function Editor({ mount, children, ...options }: EditorProps) {
  const { nodeViews, nodeViewsComponent } = useNodeViews(options.nodeViews);
  const value = useEditorView(mount, { ...options, nodeViews });
  return (
    <EditorContext.Provider value={value}>
      {children}
      {nodeViewsComponent}
    </EditorContext.Provider>
  );
}
