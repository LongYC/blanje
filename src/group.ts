import { toCents } from "./format";
import type { Account, Category, Spending } from "./types";

export interface GroupedSpending extends Spending {
  accountName: string;
  /** Amount as an integer number of cents. */
  amountCents: number;
  /** Index of this spending within the month's original `spendings` array. */
  index: number;
}

export interface CategoryGroup {
  categoryId: string;
  categoryName: string;
  spendings: GroupedSpending[];
  /** Total as an integer number of cents. */
  total: number;
  /** Share of the grand total, as a percentage (0–100). */
  percentage: number;
}

export interface AccountTotal {
  accountId: string;
  accountName: string;
  /** Total as an integer number of cents. */
  total: number;
}

export interface GroupedResult {
  groups: CategoryGroup[];
  accountTotals: AccountTotal[];
  grandTotal: number;
}

const UNKNOWN_CATEGORY = "Uncategorised";
const UNKNOWN_ACCOUNT = "Unknown account";

/**
 * Group a month's spending items by category, resolving category/account names
 * and computing per-category and grand totals. Categories declared in the data
 * are always included (even with no spendings); any spending referencing an
 * unknown category id falls into an "Uncategorised" group.
 */
export function groupByCategory(
  items: Spending[],
  categories: Category[],
  accounts: Account[],
): GroupedResult {
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const accountName = new Map(accounts.map((a) => [a.id, a.name]));

  const groups = new Map<string, CategoryGroup>();
  const accountTotalsMap = new Map<string, AccountTotal>();

  // Seed declared categories so order is stable and empty ones still show.
  for (const category of categories) {
    groups.set(category.id, {
      categoryId: category.id,
      categoryName: category.name,
      spendings: [],
      total: 0,
      percentage: 0,
    });
  }

  // Seed declared accounts so order is stable and zero-spend ones still show.
  for (const account of accounts) {
    accountTotalsMap.set(account.id, {
      accountId: account.id,
      accountName: account.name,
      total: 0,
    });
  }

  items.forEach((spending, index) => {
    let group = groups.get(spending.categoryId);
    if (!group) {
      group = {
        categoryId: spending.categoryId,
        categoryName: categoryName.get(spending.categoryId) ?? UNKNOWN_CATEGORY,
        spendings: [],
        total: 0,
        percentage: 0,
      };
      groups.set(spending.categoryId, group);
    }
    const amountCents = toCents(spending.amount);
    group.spendings.push({
      ...spending,
      index,
      amountCents,
      accountName: accountName.get(spending.accountId) ?? UNKNOWN_ACCOUNT,
    });
    group.total += amountCents;

    let accountTotal = accountTotalsMap.get(spending.accountId);
    if (!accountTotal) {
      accountTotal = {
        accountId: spending.accountId,
        accountName: accountName.get(spending.accountId) ?? UNKNOWN_ACCOUNT,
        total: 0,
      };
      accountTotalsMap.set(spending.accountId, accountTotal);
    }
    accountTotal.total += amountCents;
  });

  const groupList = [...groups.values()];
  const grandTotal = groupList.reduce((sum, g) => sum + g.total, 0);

  // Compute each category's share once the grand total is known.
  if (grandTotal > 0) {
    for (const group of groupList) {
      group.percentage = (group.total / grandTotal) * 100;
    }
  }

  return {
    groups: groupList,
    accountTotals: [...accountTotalsMap.values()],
    grandTotal,
  };
}
