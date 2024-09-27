import { Mark } from "prosemirror-model";
import React, {
  ReactNode,
  forwardRef,
  memo,
  useContext,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

import { ChildDescriptorsContext } from "../contexts/ChildDescriptorsContext.js";
import { MarkViewDesc, ViewDesc } from "../viewdesc.js";

import { OutputSpec } from "./OutputSpec.js";

type Props = {
  mark: Mark;
  pos: number;
  children: ReactNode;
};

export const MarkView = memo(
  forwardRef(function MarkView({ mark, pos, children }: Props, ref) {
    const { siblingsRef, parentRef } = useContext(ChildDescriptorsContext);
    const viewDescRef = useRef<MarkViewDesc | undefined>(undefined);

    const childDescriptors = useRef<ViewDesc[]>([]);
    const domRef = useRef<HTMLElement | null>(null);

    useImperativeHandle(
      ref,
      () => {
        return domRef.current;
      },
      []
    );

    const outputSpec = useMemo(
      () => mark.type.spec.toDOM?.(mark, true),
      [mark]
    );
    if (!outputSpec)
      throw new Error(`Mark spec for ${mark.type.name} is missing toDOM`);

    useLayoutEffect(() => {
      const siblings = siblingsRef.current;
      return () => {
        if (!viewDescRef.current) return;
        if (siblings.includes(viewDescRef.current)) {
          const index = siblings.indexOf(viewDescRef.current);
          siblings.splice(index, 1);
        }
      };
    }, [siblingsRef]);

    useLayoutEffect(() => {
      if (!domRef.current) return;

      const firstChildDesc = childDescriptors.current[0];

      if (!viewDescRef.current) {
        viewDescRef.current = new MarkViewDesc(
          parentRef.current,
          childDescriptors.current,
          pos,
          mark,
          domRef.current,
          firstChildDesc?.dom.parentElement ?? domRef.current
        );
      } else {
        viewDescRef.current.parent = parentRef.current;
        viewDescRef.current.dom = domRef.current;
        viewDescRef.current.contentDOM =
          firstChildDesc?.dom.parentElement ?? domRef.current;
        viewDescRef.current.mark = mark;
        viewDescRef.current.pos = pos;
      }
      if (!siblingsRef.current.includes(viewDescRef.current)) {
        siblingsRef.current.push(viewDescRef.current);
      }

      siblingsRef.current.sort((a, b) => a.pos - b.pos);

      for (const childDesc of childDescriptors.current) {
        childDesc.parent = viewDescRef.current;
      }
    });

    const childContextValue = useMemo(
      () => ({
        parentRef: viewDescRef,
        siblingsRef: childDescriptors,
      }),
      [childDescriptors, viewDescRef]
    );

    return (
      <OutputSpec ref={domRef} outputSpec={outputSpec}>
        <ChildDescriptorsContext.Provider value={childContextValue}>
          {children}
        </ChildDescriptorsContext.Provider>
      </OutputSpec>
    );
  })
);
