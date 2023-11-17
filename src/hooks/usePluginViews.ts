import { EditorState, Plugin, PluginView } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { useLayoutEffect, useRef } from "react";

import { usePrevious } from "./usePrev.js";

export function usePluginViews(
  view: EditorView | null,
  state: EditorState | null,
  plugins: readonly Plugin[]
) {
  const prevState = usePrevious(state);
  const pluginViews = useRef<PluginView[]>([]);

  useLayoutEffect(() => {
    if (!view || !prevState) return;

    for (const pluginView of pluginViews.current) {
      if (pluginView.update) pluginView.update(view, prevState);
    }
  }, [prevState, view]);

  useLayoutEffect(() => {
    if (!view) return;

    pluginViews.current = [];
    for (const plugin of [...plugins, ...view.state.plugins]) {
      const pluginView = plugin.spec.view?.(view);
      if (pluginView) pluginViews.current.push(pluginView);
    }
  }, [plugins, view]);

  useLayoutEffect(() => {
    return () => {
      for (const pluginView of pluginViews.current) {
        if (pluginView.destroy) pluginView.destroy();
      }
    };
  }, []);
}
