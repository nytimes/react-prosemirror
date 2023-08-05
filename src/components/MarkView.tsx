import { Mark } from "prosemirror-model";
import React, {
  ReactNode,
  forwardRef,
  useContext,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { NodeViewContext } from "../contexts/NodeViewContext.js";
import { MarkViewDesc, ViewDesc } from "../descriptors/ViewDesc.js";

import { OutputSpec } from "./OutputSpec.js";

type Props = {
  mark: Mark;
  children: ReactNode;
};

export const MarkView = forwardRef(function MarkView(
  { mark, children }: Props,
  ref
) {
  const { posToDesc, domToDesc } = useContext(NodeViewContext);
  const siblingDescriptors = useContext(ChildDescriptorsContext);
  const childDescriptors: ViewDesc[] = [];
  const domRef = useRef<HTMLElement | null>(null);

  useImperativeHandle(
    ref,
    () => {
      return domRef.current;
    },
    []
  );

  const outputSpec = mark.type.spec.toDOM?.(mark, true);
  if (!outputSpec)
    throw new Error(`Mark spec for ${mark.type.name} is missing toDOM`);

  useLayoutEffect(() => {
    if (!domRef.current) return;

    const firstChildDesc = childDescriptors[0];

    const desc = new MarkViewDesc(
      undefined,
      childDescriptors,
      mark,
      domRef.current,
      firstChildDesc?.dom.parentElement ?? domRef.current,
      posToDesc,
      domToDesc
    );
    // posToDesc.set(pos, desc);
    domToDesc.set(domRef.current, desc);
    siblingDescriptors.push(desc);

    for (const childDesc of childDescriptors) {
      childDesc.parent = desc;
    }
  });

  return (
    <OutputSpec ref={domRef} outputSpec={outputSpec}>
      <ChildDescriptorsContext.Provider value={childDescriptors}>
        {children}
      </ChildDescriptorsContext.Provider>
    </OutputSpec>
  );
});
