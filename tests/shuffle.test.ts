import { describe, expect, it } from "vitest";
import { shuffleForAttempt } from "../src/worker/lib/shuffle";

describe("shuffleForAttempt", () => {
  it("mantiene un orden estable por intento sin mutar la entrada", () => {
    const options = ["A", "B", "C", "D"];
    const first = shuffleForAttempt(options, 12345, 7);

    expect(shuffleForAttempt(options, 12345, 7)).toEqual(first);
    expect(options).toEqual(["A", "B", "C", "D"]);
    expect(first).toHaveLength(4);
    expect(new Set(first).size).toBe(4);
  });
});
