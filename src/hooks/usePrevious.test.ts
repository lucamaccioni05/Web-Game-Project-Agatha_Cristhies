/// <reference types="vitest" />
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePrevious } from "./usePrevious";

describe("usePrevious Hook", () => {
  it("should return undefined on initial render", () => {
    const { result } = renderHook(() => usePrevious(10));
    expect(result.current).toBeUndefined();
  });

  it("should return the value from the previous render", () => {
    const { result, rerender } = renderHook<any, { value: any }>(
      ({ value }) => usePrevious(value),
      {
        initialProps: { value: 10 }, // Esto es compatible con { value: any }
      }
    );

    expect(result.current).toBeUndefined();

    rerender({ value: 20 });
    expect(result.current).toBe(10);

    rerender({ value: "hello" });
    expect(result.current).toBe(20);

    rerender({ value: "hello" });
    expect(result.current).toBe("hello");
  });
});
