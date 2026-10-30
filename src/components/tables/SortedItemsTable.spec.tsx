// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Account, Category, Item } from "../../data";
import { groupItemsByCategory } from "../../group";
import { SortedItemsTable } from "./SortedItemsTable";

const categories: Category[] = [
  { id: "food", name: "Food" },
  { id: "home", name: "Home" },
  { id: "travel", name: "Travel" },
];

const accounts: Account[] = [{ id: "card", name: "Card" }];

const items: Item[] = [
  { categoryId: "food", name: "Coffee", amount: "3.50", accountId: "card" },
  { categoryId: "food", name: "Tea", amount: "2.00", accountId: "card" },
  { categoryId: "travel", name: "Train", amount: "12.00", accountId: "card" },
];

const { categoryGroups, totalSpentInCents } = groupItemsByCategory(items, categories, accounts);

afterEach(() => {
  cleanup();
});

function renderSortedTable() {
  const handlers = {
    onEditItem: vi.fn(),
    onCancelEdit: vi.fn(),
    onStartEdit: vi.fn(),
    onToggleIgnore: vi.fn(),
    onMoveItemDown: vi.fn(),
    onDeleteItem: vi.fn(),
  };
  const view = render(
    <SortedItemsTable
      items={categoryGroups.flatMap((categoryGroup) => categoryGroup.groupedItems)}
      accounts={accounts}
      hidden={new Set()}
      totalSpentInCents={totalSpentInCents}
      editingIndex={null}
      {...handlers}
    />,
  );

  return { ...view, ...handlers };
}

describe("SortedItemsTable", () => {
  it("renders one accessible table with name-sorted items", () => {
    renderSortedTable();

    const table = screen.getByRole("table", { name: "Items sorted by name" });
    expect(screen.getAllByRole("table")).toHaveLength(1);
    expect(within(table).getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
      "Item",
      "Amount",
      "Account",
    ]);
    const names = Array.from(table.querySelectorAll("tbody tr td:first-child"))
      .map((cell) => cell.textContent?.trim())
      .filter((name) => ["Coffee", "Tea", "Train"].includes(name ?? ""));
    expect(names).toEqual(["Coffee", "Tea", "Train"]);
  });

  it("preserves original item indexes for actions after sorting", async () => {
    const user = userEvent.setup();
    const { onToggleIgnore } = renderSortedTable();
    const trainRow = screen.getByRole("row", { name: /Train/ });

    await user.click(within(trainRow).getByRole("button", { name: "Item actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Ignore" }));
    expect(onToggleIgnore).toHaveBeenCalledWith(2);
  });
});