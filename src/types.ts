export interface Category {
  id: string;
  name: string;
}

export interface Account {
  id: string;
  name: string;
}

export interface Spending {
  categoryId: string;
  name: string;
  amount: string; // kept as a string in the source data, parsed when summing
  accountId: string;
}

/** One month's worth of spending items, keyed by a `YYYYMM` integer. */
export interface MonthlySpendings {
  month: number; // e.g. 202607 for July 2026
  items: Spending[];
}

/** The whole document: global accounts/categories plus per-month spendings. */
export interface SpendingsData {
  accounts: Account[];
  categories: Category[];
  spendings: MonthlySpendings[];
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** A human-readable label for a `YYYYMM` month, e.g. `June 2026`. */
export function monthLabel(month: number): string {
  const year = Math.floor(month / 100);
  const m = month % 100;
  const name = MONTH_NAMES[m - 1] ?? `Month ${m}`;
  return `${name} ${year}`;
}
