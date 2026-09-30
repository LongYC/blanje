import { describe, expect, it } from "vitest";
import {
  groupItemsByCategory,
  sortGroupedItemsByName,
  type GroupedItem,
} from "./group";

function item(name: string, index: number): GroupedItem {
  return {
    categoryId: "category",
    name,
    amount: "1.00",
    accountId: "account",
    accountName: "Account",
    amountCents: 100,
    index,
  };
}

describe("sortGroupedItemsByName", () => {
  it("sorts names without changing the source order", () => {
    const items = [item("zebra", 0), item("Apple", 1), item("banana", 2)];

    expect(sortGroupedItemsByName(items).map(({ name }) => name)).toEqual([
      "Apple",
      "banana",
      "zebra",
    ]);
    expect(items.map(({ name }) => name)).toEqual(["zebra", "Apple", "banana"]);
  });

  it("keeps duplicate names in original item order", () => {
    const items = [item("Coffee", 4), item("coffee", 1), item("Tea", 2)];

    expect(sortGroupedItemsByName(items).map(({ index }) => index)).toEqual([1, 4, 2]);
  });
});

describe("groupItemsByCategory", () => {
  it("totals declared and unknown categories/accounts while excluding ignored items", () => {
    const result = groupItemsByCategory(
      [
        { categoryId: "food", name: "Lunch", amount: "12.50", accountId: "card", labels: ["work"] },
        { categoryId: "food", name: "Refund", amount: "2.00", accountId: "card", ignore: true, labels: ["ignored"] },
        { categoryId: "other", name: "Gift", amount: "5.25", accountId: "cash", labels: ["work", "gift"] },
        { categoryId: "other", name: "Snack", amount: "1.25", accountId: "cash", labels: [] },
      ],
      [
        { id: "food", name: "Food" },
        { id: "empty", name: "Empty" },
      ],
      [
        { id: "card", name: "Card" },
        { id: "empty", name: "Unused" },
      ],
    );

    expect(result.categoryGroups).toEqual([
      expect.objectContaining({ categoryId: "food", categoryName: "Food", total: 1250, percentage: 65.78947368421053 }),
      expect.objectContaining({ categoryId: "empty", categoryName: "Empty", total: 0, percentage: 0 }),
      expect.objectContaining({ categoryId: "other", categoryName: "Uncategorised", total: 650, percentage: 34.21052631578947 }),
    ]);
    expect(result.categoryGroups[0]?.groupedItems[1]).toEqual(
      expect.objectContaining({ index: 1, amountCents: 200, accountName: "Card" }),
    );
    expect(result.accountTotals).toEqual([
      { accountId: "card", accountName: "Card", total: 1250 },
      { accountId: "empty", accountName: "Unused", total: 0 },
      { accountId: "cash", accountName: "Unknown account", total: 650 },
    ]);
    expect(result.grandTotal).toBe(1900);
    expect(result.labelTotals).toEqual([
      { label: "work", total: 1775 },
      { label: "gift", total: 525 },
    ]);
  });

  it("keeps percentages at zero when all spend is ignored or totals are non-positive", () => {
    const result = groupItemsByCategory(
      [
        { categoryId: "food", name: "Ignored", amount: "3.00", accountId: "unknown", ignore: true },
        { categoryId: "travel", name: "Credit", amount: "-2.00", accountId: "another" },
      ],
      [],
      [],
    );

    expect(result.grandTotal).toBe(-200);
    expect(result.categoryGroups.map(({ categoryName, percentage }) => [categoryName, percentage])).toEqual([
      ["Uncategorised", 0],
      ["Uncategorised", 0],
    ]);
    expect(result.accountTotals).toEqual([
      { accountId: "another", accountName: "Unknown account", total: -200 },
    ]);
    expect(result.labelTotals).toEqual([]);
  });
});
