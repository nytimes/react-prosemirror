type StopEventContextValue = (stopEvent: (event: Event) => boolean | undefined) => void;
export declare const StopEventContext: import("react").Context<StopEventContextValue>;
export {};
