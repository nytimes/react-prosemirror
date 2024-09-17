import React, {
  DetailedHTMLProps,
  ForwardedRef,
  HTMLAttributes,
  ReactElement,
  createContext,
  forwardRef,
  useContext,
  useImperativeHandle,
  useRef,
} from "react";

import { ViewDescriptorContext } from "../contexts/ViewDescriptorContext.js";

import { DocNodeView, DocNodeViewProps } from "./DocNodeView.js";

type DocNodeViewContextValue = Omit<DocNodeViewProps, "as"> & {
  setMount: (mount: HTMLElement | null) => void;
};

export const DocNodeViewContext = createContext<DocNodeViewContextValue>(
  null as unknown as DocNodeViewContextValue
);

type Props = {
  as?: ReactElement;
} & Omit<DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLDivElement>, "ref">;

function ProseMirrorDoc(
  { as, ...props }: Props,
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
    <ViewDescriptorContext.Provider value={{}}>
      <DocNodeView
        ref={(el) => {
          innerRef.current = el;
          setMount(el);
        }}
        {...props}
        {...docProps}
        as={as}
      />
    </ViewDescriptorContext.Provider>
  );
}

const ForwardedProseMirrorDoc = forwardRef(ProseMirrorDoc);

export { ForwardedProseMirrorDoc as ProseMirrorDoc };
