const currencyFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Convert an amount string to a number, allowing at most two decimals. */
export function toCents(amount: string): number {
  const decimals = amount.split(".")[1];

  if (!decimals) {
    return Number(amount) * 100;
  }

  if (decimals?.length > 2) {
    throw new Error(`Amount "${amount}" has more than two decimal places`);
  }

  return Math.round(Number(amount) * 100)
}

/** Format an integer number of cents with thousands separators and 2 decimals. */
export function formatCents(cents: number): string {
  return currencyFormatter.format(cents / 100);
}
