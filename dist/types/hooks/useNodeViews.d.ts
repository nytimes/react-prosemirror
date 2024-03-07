import { ReactNodeViewConstructor } from "../nodeViews/createReactNodeViewConstructor.js";
export declare function useNodeViews(nodeViews: Record<string, ReactNodeViewConstructor>): {
    nodeViews: any;
    renderNodeViews: () => JSX.Element;
};
