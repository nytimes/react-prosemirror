import { Plugin, PluginView } from "prosemirror-state";
import { useLayoutEffect, useRef } from "react";

import { EditorView } from "../prosemirror-view/index.js";

import { usePrevious } from "./usePrev.js";

export function usePluginViews(
  view: EditorView | null,
  plugins: readonly Plugin[]
) {
  const prevState = usePrevious(view?.state);
  const pluginViews = useRef<PluginView[]>([]);

  useLayoutEffect(() => {
    if (!view || !prevState) return;

    for (const pluginView of pluginViews.current) {
      // @ts-expect-error Side effect of the fork
      if (pluginView.update) pluginView.update(view, prevState);
    }
  }, [prevState, view]);

  useLayoutEffect(() => {
    if (!view) return;

    pluginViews.current = [];
    for (const plugin of plugins) {
      // @ts-expect-error Side effect of the fork
      const pluginView = plugin.spec.view?.(view);
      if (pluginView) pluginViews.current.push(pluginView);
    }

    return () => {
      for (const pluginView of pluginViews.current) {
        if (pluginView.destroy) pluginView.destroy();
      }
    };
  }, [plugins, view]);
}
