import React, {
  DetailedHTMLProps,
  ForwardedRef,
  HTMLAttributes,
  ReactElement,
  createContext,
  forwardRef,
  useContext,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { ViewDesc } from "../viewdesc.js";

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
  const childDescriptors = useRef<ViewDesc[]>([]);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const { setMount, ...docProps } = useContext(DocNodeViewContext);
  const viewDescRef = useRef(undefined);

  useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(
    ref,
    () => {
      return innerRef.current;
    },
    []
  );

  const childContextValue = useMemo(
    () => ({
      parentRef: viewDescRef,
      siblingsRef: childDescriptors,
    }),
    [childDescriptors, viewDescRef]
  );

  return (
    <ChildDescriptorsContext.Provider value={childContextValue}>
      <DocNodeView
        ref={(el) => {
          innerRef.current = el;
          setMount(el);
        }}
        {...props}
        {...docProps}
        as={as}
      />
    </ChildDescriptorsContext.Provider>
  );
}

const ForwardedProseMirrorDoc = forwardRef(ProseMirrorDoc);

export { ForwardedProseMirrorDoc as ProseMirrorDoc };
