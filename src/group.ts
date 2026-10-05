import { toCents } from "./format";
import type { Account, Category, Item } from "./data";

export interface GroupedItem extends Item {
  accountName: string;
  /** Amount as an integer number of cents. */
  amountCents: number;
  /** Index of this item within the month's original `items` array. */
  index: number;
}

export interface CategoryGroup {
  categoryId: string;
  categoryName: string;
  groupedItems: GroupedItem[];
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
  categoryGroups: CategoryGroup[];
  accountTotals: AccountTotal[];
  grandTotal: number;
  labelTotals: LabelTotal[];
}

export function sortGroupedItemsByName(items: GroupedItem[]): GroupedItem[] {
  return [...items].sort(
    (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) || a.index - b.index,
  );
}

export function orderItemsByCategory(items: Item[], categories: Category[]): Item[] {
  const itemsByCategory = new Map<string, Item[]>();
  for (const item of items) {
    const categoryItems = itemsByCategory.get(item.categoryId) ?? [];
    categoryItems.push(item);
    itemsByCategory.set(item.categoryId, categoryItems);
  }

  const orderedCategoryIds = [
    ...new Set(categories.map(({ id }) => id)),
    ...[...itemsByCategory.keys()].filter((id) => !categories.some((category) => category.id === id)),
  ];
  return orderedCategoryIds.flatMap((id) => itemsByCategory.get(id) ?? []);
}

export function moveItemDown(items: Item[], itemIndex: number): Item[] {
  const item = items[itemIndex];
  if (!item) return items;

  let nextIndex = itemIndex + 1;
  while (nextIndex < items.length && items[nextIndex]?.categoryId !== item.categoryId) {
    nextIndex++;
  }
  if (nextIndex === items.length) return items;

  const reorderedItems = [...items];
  const [movedItem] = reorderedItems.splice(itemIndex, 1);
  if (movedItem) reorderedItems.splice(nextIndex, 0, movedItem);
  return reorderedItems;
}

export interface LabelTotal {
  label: string;
  /** Total as an integer number of cents. */
  total: number;
}

const UNKNOWN_CATEGORY = "Uncategorised";
const UNKNOWN_ACCOUNT = "Unknown account";

export function groupItemsByCategory(
  items: Item[],
  categories: Category[],
  accounts: Account[],
): GroupedResult {
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const accountName = new Map(accounts.map((a) => [a.id, a.name]));

  const categoryGroupMap = new Map<string, CategoryGroup>();
  const accountTotalsMap = new Map<string, AccountTotal>();

  // Seed declared categories so order is stable and empty ones still show.
  for (const category of categories) {
    categoryGroupMap.set(category.id, {
      categoryId: category.id,
      categoryName: category.name,
      groupedItems: [],
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

  items.forEach((item, index) => {
    let group = categoryGroupMap.get(item.categoryId);
    if (!group) {
      group = {
        categoryId: item.categoryId,
        categoryName: categoryName.get(item.categoryId) ?? UNKNOWN_CATEGORY,
        groupedItems: [],
        total: 0,
        percentage: 0,
      };
      categoryGroupMap.set(item.categoryId, group);
    }
    const amountCents = toCents(item.amount);
    group.groupedItems.push({
      ...item,
      index,
      amountCents,
      accountName: accountName.get(item.accountId) ?? UNKNOWN_ACCOUNT,
    });
    // Ignored items are still listed but not counted in any total.
    if (item.ignore) return;
    group.total += amountCents;

    let accountTotal = accountTotalsMap.get(item.accountId);
    if (!accountTotal) {
      accountTotal = {
        accountId: item.accountId,
        accountName: accountName.get(item.accountId) ?? UNKNOWN_ACCOUNT,
        total: 0,
      };
      accountTotalsMap.set(item.accountId, accountTotal);
    }
    accountTotal.total += amountCents;
  });

  const categoryGroups = [...categoryGroupMap.values()];
  const grandTotal = categoryGroups.reduce((sum, g) => sum + g.total, 0);
  if (grandTotal > 0) {
    for (const categoryGroup of categoryGroups) {
      categoryGroup.percentage = (categoryGroup.total / grandTotal) * 100;
    }
  }

  // Compute label totals (do not affect other calculations). Exclude ignored items.
  const labelTotalsMap = new Map<string, number>();
  items.forEach((item) => {
    if (item.ignore) return;
    const cents = toCents(item.amount);
    if (!item.labels) return;
    for (const label of item.labels) {
      labelTotalsMap.set(label, (labelTotalsMap.get(label) ?? 0) + cents);
    }
  });

  const labelTotals = [...labelTotalsMap.entries()].map(([label, total]) => ({ label, total }));

  return {
    categoryGroups,
    accountTotals: [...accountTotalsMap.values()],
    grandTotal,
    labelTotals
  };
}
