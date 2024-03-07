import React, {
  ForwardedRef,
  ReactElement,
  createContext,
  forwardRef,
  useContext,
  useImperativeHandle,
  useRef,
} from "react";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";

import { DocNodeView, DocNodeViewProps } from "./DocNodeView.js";

type DocNodeViewContextValue = Omit<DocNodeViewProps, "as"> & {
  setMount: (mount: HTMLElement | null) => void;
};

export const DocNodeViewContext = createContext<DocNodeViewContextValue>(
  null as unknown as DocNodeViewContextValue
);

type Props = {
  as?: ReactElement;
};

function ProseMirrorDoc(
  { as }: Props,
  ref: ForwardedRef<HTMLDivElement | null>
) {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const { setMount, ...docProps } = useContext(DocNodeViewContext);

  useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(
    ref,
    () => {
      return innerRef.current;
    },
    []
  );

  return (
    <ChildDescriptorsContext.Provider value={[]}>
      <DocNodeView
        ref={(el) => {
          innerRef.current = el;
          setMount(el);
        }}
        {...docProps}
        as={as}
      />
    </ChildDescriptorsContext.Provider>
  );
}

const ForwardedProseMirrorDoc = forwardRef(ProseMirrorDoc);

export { ForwardedProseMirrorDoc as ProseMirrorDoc };
