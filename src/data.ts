export interface Category {
  id: string;
  name: string;
}

export interface Account {
  id: string;
  name: string;
}

export interface Item {
  categoryId: string;
  name: string;
  amount: string; // kept as a string in the source data, parsed when summing
  accountId: string;
  /**
   * When `true`, the item is excluded from all totals. Absent is treated the
   * same as `false`; the property is only ever stored when `true` so a saved
   * file never carries `ignore: false`.
   */
  ignore?: boolean;
  /** Optional list of labels attached to the item. */
  labels?: string[];
}

/** Monthly spendings, each month keyed by a `YYYYMM` integer. */
export interface MonthlySpending {
  month: number; // e.g. 202607 for July 2026
  items: Item[];
  note?: string;
}

export interface UserData {
  accounts: Account[];
  categories: Category[];
  spendings: MonthlySpending[];
}

export interface AppData {
  lastLoadedFilename?: string;
  hiddenAccounts?: string[];
  lastEdited?: string; // formatted as `YYYY-MM-DD_HHmm_ss`.
}
