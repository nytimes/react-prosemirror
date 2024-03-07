import React from "react";
export interface LayoutGroupProps {
    children: React.ReactNode;
}
/**
 * Provides a boundary for grouping layout effects.
 *
 * Descendant components can invoke the `useLayoutGroupEffect` hook to register
 * effects that run after all descendants within the group have processed their
 * regular layout effects.
 */
export declare function LayoutGroup({ children }: LayoutGroupProps): JSX.Element;
