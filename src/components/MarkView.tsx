import { Mark } from "prosemirror-model";
import React, { ReactNode, forwardRef } from "react";

import { OutputSpec } from "./OutputSpec.js";

type Props = {
  mark: Mark;
  children: ReactNode;
};

export const MarkView = forwardRef(function MarkView(
  { mark, children }: Props,
  ref
) {
  const outputSpec = mark.type.spec.toDOM?.(mark, true);
  if (!outputSpec)
    throw new Error(`Mark spec for ${mark.type.name} is missing toDOM`);

  return (
    <OutputSpec ref={ref} outputSpec={outputSpec}>
      {children}
    </OutputSpec>
  );
});
