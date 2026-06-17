export interface Period {
  year: number;
  month: number; // 1-12
}

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

export interface MonthlyData {
  period: Period;
  categories: Category[];
  accounts: Account[];
  spendings: Spending[];
}

/** A stable string key for a period, e.g. `2026-06`. */
export function periodKey(period: Period): string {
  return `${period.year}-${String(period.month).padStart(2, "0")}`;
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

/** A human-readable period label, e.g. `June 2026`. */
export function periodLabel(period: Period): string {
  const name = MONTH_NAMES[period.month - 1] ?? `Month ${period.month}`;
  return `${name} ${period.year}`;
}
