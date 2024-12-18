"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _react = require("@testing-library/react");
const _react1 = /*#__PURE__*/ _interopRequireWildcard(require("react"));
const _layoutGroupJs = require("../../components/LayoutGroup.js");
const _useLayoutGroupEffectJs = require("../../hooks/useLayoutGroupEffect.js");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interopRequireWildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {};
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
describe("DeferredLayoutEffects", ()=>{
    jest.useFakeTimers("modern");
    it("registers multiple effects and runs them", ()=>{
        function Parent() {
            return /*#__PURE__*/ _react1.default.createElement(_layoutGroupJs.LayoutGroup, null, /*#__PURE__*/ _react1.default.createElement(Child, null));
        }
        function Child() {
            const [double, setDouble] = (0, _react1.useState)(1);
            (0, _react1.useLayoutEffect)(()=>{
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
            (0, _useLayoutGroupEffectJs.useLayoutGroupEffect)(()=>{
                const timeout = setTimeout(()=>{
                    setDouble((d)=>d * 2);
                }, 1000);
                return ()=>{
                    clearTimeout(timeout);
                };
            }, [
                double
            ]);
            return /*#__PURE__*/ _react1.default.createElement("div", null, /*#__PURE__*/ _react1.default.createElement("div", {
                "data-testid": "double"
            }, double));
        }
        // The component mounts ...
        // ... the initial value should be 1
        // ... there should be one timeout scheduled by the deferred effect
        (0, _react.render)(/*#__PURE__*/ _react1.default.createElement(Parent, null));
        expect(_react.screen.getByTestId("double").innerHTML).toBe("1");
        // This block assert that deferred effects run.
        // --------------------------------------------
        // 1000 milliseconds go by ...
        // ... the timeout set by the deferred effect should run
        // ... the timeout should double the new value to 2
        // ... the immediate effect should set a timeout
        // ... the deferred effect should set a timeout
        (0, _react.act)(()=>{
            jest.advanceTimersByTime(1000);
        });
        expect(_react.screen.getByTestId("double").innerHTML).toBe("2");
        // The next three blocks assert that cleanup of deferred effects run.
        // ------------------------------------------------------------------
        // 500 milliseconds go by ...
        // ... the timeout set by the immediate effect should run
        // ... the timeout should set the value to 5
        // ... the old deferred effect should cancel its timeout
        // ... the new deferred effect should set a new timeout
        (0, _react.act)(()=>{
            jest.advanceTimersByTime(500);
        });
        expect(_react.screen.getByTestId("double").innerHTML).toBe("5");
        // ... 500 more milliseconds go by ...
        // ... the canceled timeout should not run
        // ... the rescheduled timoeut should not yet run
        (0, _react.act)(()=>{
            jest.advanceTimersByTime(500);
        });
        expect(_react.screen.getByTestId("double").innerHTML).toBe("5");
        // ... 500 more milliseconds go by ...
        // ... the rescheduled timeout should run
        // ... the timeout should double the value to 10
        // ... the deferred effect should set a new timeout
        (0, _react.act)(()=>{
            jest.advanceTimersByTime(500);
        });
        expect(_react.screen.getByTestId("double").innerHTML).toBe("10");
        // The next block asserts that cancelation of deferred effects works.
        // ------------------------------------------------------------------
        // 1000 milliseconds go by ...
        // ... the timeout set by the deferred effect should run
        // ... the timeout should double the value to 20
        // ... the immediate effect should then set the value to 50
        // ... the deferred effect from the first render should not run
        // ... the deferred effect from the second render should run
        // ... the deferred effect that does run should set a new timeout
        (0, _react.act)(()=>{
            jest.advanceTimersByTime(1000);
        });
        // For this assertion, we need to clear a timer from the React scheduler.
        jest.advanceTimersByTime(1);
        expect(_react.screen.getByTestId("double").innerHTML).toBe("50");
        expect(jest.getTimerCount()).toBe(1);
    });
});
