import { describe, expect, it } from "vitest";
import { sortGroupedItemsByName, type GroupedItem } from "./group";

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