import { Plugin, PluginView } from "prosemirror-state";
import { useLayoutEffect, useRef } from "react";

import { EditorViewInternal } from "../prosemirror-internal/EditorViewInternal.js";

import { usePrevious } from "./usePrev.js";

export function usePluginViews(
  view: EditorViewInternal | null,
  plugins: readonly Plugin[]
) {
  const prevState = usePrevious(view?.state);
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
    for (const plugin of plugins) {
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
