import { Plugin, PluginView } from "prosemirror-state";
import { MutableRefObject, useLayoutEffect, useRef } from "react";

import { EditorViewInternal } from "../prosemirror-internal/EditorViewInternal.js";

import { usePrevious } from "./usePrev.js";

export function usePluginViews(
  viewRef: MutableRefObject<EditorViewInternal>,
  plugins: readonly Plugin[]
) {
  const prevState = usePrevious(viewRef.current.state);
  const pluginViews = useRef<PluginView[]>([]);

  useLayoutEffect(() => {
    if (!prevState) return;

    for (const pluginView of pluginViews.current) {
      if (pluginView.update) pluginView.update(viewRef.current, prevState);
    }
  }, [prevState, viewRef]);

  useLayoutEffect(() => {
    pluginViews.current = [];
    for (const plugin of plugins) {
      const pluginView = plugin.spec.view?.(viewRef.current);
      if (pluginView) pluginViews.current.push(pluginView);
    }

    return () => {
      for (const pluginView of pluginViews.current) {
        if (pluginView.destroy) pluginView.destroy();
      }
    };
  }, [plugins, viewRef]);
}
