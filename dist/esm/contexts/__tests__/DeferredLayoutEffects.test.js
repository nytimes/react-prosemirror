import { act, render, screen } from "@testing-library/react";
import React, { useLayoutEffect, useState } from "react";
import { LayoutGroup } from "../../components/LayoutGroup.js";
import { useLayoutGroupEffect } from "../../hooks/useLayoutGroupEffect.js";
describe("DeferredLayoutEffects", ()=>{
    jest.useFakeTimers("modern");
    it("registers multiple effects and runs them", ()=>{
        function Parent() {
            return /*#__PURE__*/ React.createElement(LayoutGroup, null, /*#__PURE__*/ React.createElement(Child, null));
        }
        function Child() {
            const [double, setDouble] = useState(1);
            useLayoutEffect(()=>{
                if (double === 2) {
                    setTimeout(()=>{
                        setDouble((d)=>d * 2.5);
                    }, 500);
                }
                if (double === 20) {
                    setDouble((d)=>d * 2.5);
                }
            }, [
                double
            ]);
            useLayoutGroupEffect(()=>{
                const timeout = setTimeout(()=>{
                    setDouble((d)=>d * 2);
                }, 1000);
                return ()=>{
                    clearTimeout(timeout);
                };
            }, [
                double
            ]);
            return /*#__PURE__*/ React.createElement("div", null, /*#__PURE__*/ React.createElement("div", {
                "data-testid": "double"
            }, double));
        }
        // The component mounts ...
        // ... the initial value should be 1
        // ... there should be one timeout scheduled by the deferred effect
        render(/*#__PURE__*/ React.createElement(Parent, null));
        expect(screen.getByTestId("double").innerHTML).toBe("1");
        // This block assert that deferred effects run.
        // --------------------------------------------
        // 1000 milliseconds go by ...
        // ... the timeout set by the deferred effect should run
        // ... the timeout should double the new value to 2
        // ... the immediate effect should set a timeout
        // ... the deferred effect should set a timeout
        act(()=>{
            jest.advanceTimersByTime(1000);
        });
        expect(screen.getByTestId("double").innerHTML).toBe("2");
        // The next three blocks assert that cleanup of deferred effects run.
        // ------------------------------------------------------------------
        // 500 milliseconds go by ...
        // ... the timeout set by the immediate effect should run
        // ... the timeout should set the value to 5
        // ... the old deferred effect should cancel its timeout
        // ... the new deferred effect should set a new timeout
        act(()=>{
            jest.advanceTimersByTime(500);
        });
        expect(screen.getByTestId("double").innerHTML).toBe("5");
        // ... 500 more milliseconds go by ...
        // ... the canceled timeout should not run
        // ... the rescheduled timoeut should not yet run
        act(()=>{
            jest.advanceTimersByTime(500);
        });
        expect(screen.getByTestId("double").innerHTML).toBe("5");
        // ... 500 more milliseconds go by ...
        // ... the rescheduled timeout should run
        // ... the timeout should double the value to 10
        // ... the deferred effect should set a new timeout
        act(()=>{
            jest.advanceTimersByTime(500);
        });
        expect(screen.getByTestId("double").innerHTML).toBe("10");
        // The next block asserts that cancelation of deferred effects works.
        // ------------------------------------------------------------------
        // 1000 milliseconds go by ...
        // ... the timeout set by the deferred effect should run
        // ... the timeout should double the value to 20
        // ... the immediate effect should then set the value to 50
        // ... the deferred effect from the first render should not run
        // ... the deferred effect from the second render should run
        // ... the deferred effect that does run should set a new timeout
        act(()=>{
            jest.advanceTimersByTime(1000);
        });
        // For this assertion, we need to clear a timer from the React scheduler.
        jest.advanceTimersByTime(1);
        expect(screen.getByTestId("double").innerHTML).toBe("50");
        expect(jest.getTimerCount()).toBe(1);
    });
});
