const currencyFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Convert an amount string (e.g. "123.45") to an integer number of cents.
 * Working in integer cents keeps sums exact and avoids floating-point drift
 * when accumulating many amounts.
 */
export function toCents(amount: string): number {
  return Math.round(Number(amount) * 100);
}

/** Format an integer number of cents with thousands separators and 2 decimals. */
export function formatCents(cents: number): string {
  return currencyFormatter.format(cents / 100);
}
