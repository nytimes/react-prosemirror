export declare function useReactKeys(): {
    posToKey: Map<number, string>;
    keyToPos: Map<string, number>;
    posToNode: Map<number, import("prosemirror-model").Node>;
} | null | undefined;
