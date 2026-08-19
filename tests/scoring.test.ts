import { describe, expect, it } from "vitest";
import { computeScore, type KeyEntry } from "../src/worker/lib/scoring";

describe("computeScore", () => {
  it("separa causal y predictiva y excluye el calentamiento", () => {
    const key = new Map<number, KeyEntry>([
      [100, { correct: "B", type: "causal", scored: false }],
      [1, { correct: "B", type: "causal", scored: true }],
      [2, { correct: "D", type: "predictiva", scored: true }],
    ]);

    expect(
      computeScore(key, [
        { question_id: 100, selected_option: "B" },
        { question_id: 1, selected_option: "B" },
        { question_id: 2, selected_option: "A" },
      ]),
    ).toEqual({ total: 1, causal: 1, predictive: 0, answered: 2 });
  });
});
