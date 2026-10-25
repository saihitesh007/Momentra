import { describe, expect, it } from "vitest";
import { budgetTotals, computeEstimated, normalizePercentages } from "@/backend/lib/money";

describe("money helpers", () => {
  it("normalizes awkward input percentages to exactly 100", () => {
    const items = normalizePercentages([{ percentage: 33.33 }, { percentage: 33.33 }, { percentage: 33.33 }]);
    expect(items.reduce((sum, item) => sum + item.percentage, 0)).toBe(100);
  });
  it("rejects an all-zero percentage plan", () => {
    expect(() => normalizePercentages([{ percentage: 0 }, { percentage: -1 }])).toThrow(RangeError);
  });
  it("computes estimate with cent rounding", () => {
    expect(computeEstimated(12.345, 100)).toBe(12.35);
  });
  it("rejects invalid money inputs", () => {
    expect(() => computeEstimated(-1, 100)).toThrow(RangeError);
    expect(() => computeEstimated(10, Number.NaN)).toThrow(RangeError);
  });
  it("returns stable totals for an empty budget", () => {
    expect(budgetTotals([], 100)).toEqual({ estimatedTotal: 0, actualTotal: 0, paidTotal: 0, remaining: 100, overBudget: false });
  });
  it("marks overspend and sums only paid actuals", () => {
    expect(budgetTotals([
      { estimated: 40, actual: 55.25, paid: true },
      { estimated: 60, actual: 50, paid: false },
    ], 100)).toEqual({ estimatedTotal: 100, actualTotal: 105.25, paidTotal: 55.25, remaining: -5.25, overBudget: true });
  });
});
