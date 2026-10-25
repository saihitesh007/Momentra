export interface PercentageItem {
  percentage: number;
}

export interface BudgetTotalItem {
  estimated: number;
  actual: number;
  paid: boolean;
}

export interface BudgetTotals {
  estimatedTotal: number;
  actualTotal: number;
  paidTotal: number;
  remaining: number;
  overBudget: boolean;
}

/** Normalizes positive percentages to two decimals, correcting the final item for rounding. */
export function normalizePercentages<T extends PercentageItem>(items: readonly T[]): T[] {
  if (items.length === 0) return [];
  const values = items.map((item) => (Number.isFinite(item.percentage) ? Math.max(0, item.percentage) : 0));
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) throw new RangeError("At least one percentage must be positive.");
  const scaled = values.map((value) => Math.round((value / total) * 10_000) / 100);
  const prefix = scaled.slice(0, -1).reduce((sum, value) => sum + value, 0);
  scaled[scaled.length - 1] = (10_000 - Math.round(prefix * 100)) / 100;
  return items.map((item, index) => ({ ...item, percentage: scaled[index] }));
}

/** Computes a budget amount using integer cents and returns a two-decimal number. */
export function computeEstimated(percentage: number, totalBudget: number): number {
  if (!Number.isFinite(percentage) || !Number.isFinite(totalBudget) || percentage < 0 || totalBudget < 0) {
    throw new RangeError("Percentage and budget must be finite non-negative numbers.");
  }
  const budgetCents = Math.round(totalBudget * 100);
  return Math.round((budgetCents * percentage) / 100) / 100;
}

/** Calculates estimated, actual, paid and remaining totals from budget rows. */
export function budgetTotals(items: readonly BudgetTotalItem[], totalBudget: number): BudgetTotals {
  const cents = (value: number) => Math.round((Number.isFinite(value) ? value : 0) * 100);
  const estimatedCents = items.reduce((sum, item) => sum + cents(item.estimated), 0);
  const actualCents = items.reduce((sum, item) => sum + cents(item.actual), 0);
  const paidCents = items.reduce((sum, item) => sum + (item.paid ? cents(item.actual) : 0), 0);
  const totalCents = cents(totalBudget);
  return {
    estimatedTotal: estimatedCents / 100,
    actualTotal: actualCents / 100,
    paidTotal: paidCents / 100,
    remaining: (totalCents - actualCents) / 100,
    overBudget: actualCents > totalCents,
  };
}
