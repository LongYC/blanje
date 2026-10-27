import { toCents } from "./format";

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
export interface BudgetTransfer {
  fromCategoryId: string;
  toCategoryId: string;
  amount: string; // kept as a string in the source data, parsed when applying to budgets
}

export interface MonthlySpending {
  month: number; // e.g. 202607 for July 2026
  note?: string;
  budgets?: Record<string, string>;
  budgetTransfers?: BudgetTransfer[];
  items: Item[];
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

/**
 * Returns the effective category budgets after applying month-local transfers.
 * The original budget map is preserved; transfers only reallocate the same total.
 */
export function getEffectiveBudgetMap(
  budgets: Record<string, string> | undefined,
  budgetTransfers: BudgetTransfer[] | undefined,
): Record<string, number> {
  const effective = new Map<string, number>();

  for (const [categoryId, amount] of Object.entries(budgets ?? {})) {
    effective.set(categoryId, toCents(amount));
  }

  for (const transfer of budgetTransfers ?? []) {
    const amountInCents = toCents(transfer.amount);
    const fromBudget = effective.get(transfer.fromCategoryId) ?? 0;
    effective.set(transfer.fromCategoryId, fromBudget - amountInCents);
    const toBudget = effective.get(transfer.toCategoryId) ?? 0;
    effective.set(transfer.toCategoryId, toBudget + amountInCents);
  }

  return Object.fromEntries(effective.entries());
}
