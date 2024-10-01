import { MutableRefObject } from "react";
type Props = {
    getPos: MutableRefObject<() => number>;
};
export declare function SeparatorHackView({ getPos }: Props): JSX.Element | null;
export {};
