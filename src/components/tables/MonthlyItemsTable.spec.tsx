// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Account, Category, Item } from "../../data";
import { groupItemsByCategory } from "../../group";
import { MonthlyItemsTable } from "./MonthlyItemsTable";

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

const { categoryGroups, grandTotal } = groupItemsByCategory(items, categories, accounts);

afterEach(() => {
  cleanup();
});

function renderTable(viewMode: "category" | "name") {
  const onAddItem = vi.fn();
  const onEditItem = vi.fn();
  const onToggleIgnore = vi.fn();
  const onMoveItemUp = vi.fn();

  const view = render(
    <MonthlyItemsTable
      categoryGroups={categoryGroups}
      accounts={accounts}
      hiddenAccountIds={[]}
      grandTotal={grandTotal}
      budgets={{}}
      viewMode={viewMode}
      onAddItem={onAddItem}
      onEditItem={onEditItem}
      onToggleIgnore={onToggleIgnore}
      onMoveItemUp={onMoveItemUp}
    />,
  );

  return { ...view, onAddItem, onEditItem, onToggleIgnore, onMoveItemUp };
}

describe("MonthlyItemsTable", () => {
  it("renders a separate headed table for every category, including empty categories", () => {
    renderTable("category");

    const tables = screen.getAllByRole("table");
    expect(tables).toHaveLength(3);
    expect(tables.map((table) => table.querySelector("tbody tr th")?.textContent)).toEqual([
      "Food",
      "Home",
      "Travel",
    ]);
    for (const table of tables) {
      expect(within(table).getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
        "Category",
        "Spent",
        "Account",
      ]);
    }
    expect(within(tables[0]!).getByText("Coffee")).toBeTruthy();
    expect(within(tables[0]!).getByText("Tea")).toBeTruthy();
    expect(within(tables[1]!).getByText("No spendings")).toBeTruthy();
    expect(within(tables[2]!).getByText("Train")).toBeTruthy();
  });

  it("keeps name-sorted items in one table", () => {
    renderTable("name");

    const tables = screen.getAllByRole("table");
    expect(tables).toHaveLength(1);
    expect(within(tables[0]!).getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
      "Item",
      "Spent",
      "Account",
    ]);
    const names = Array.from(tables[0]!.querySelectorAll("tbody tr td:first-child"))
      .map((cell) => cell.textContent?.trim())
      .filter((name) => ["Coffee", "Tea", "Train"].includes(name ?? ""));
    expect(names).toEqual(["Coffee", "Tea", "Train"]);
  });

  it("shares edit state across category tables and preserves original item indexes", async () => {
    const user = userEvent.setup();
    const { onToggleIgnore } = renderTable("category");
    const tables = screen.getAllByRole("table");
    const coffeeRow = within(tables[0]!).getByRole("row", { name: /Coffee/ });

    await user.click(within(coffeeRow).getByRole("button", { name: "Item actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(within(tables[2]!).getByRole("button", { name: "Item actions" }).hasAttribute("disabled")).toBe(true);

    await user.click(screen.getByRole("button", { name: "Keep" }));
    const trainRow = within(tables[2]!).getByRole("row", { name: /Train/ });
    await user.click(within(trainRow).getByRole("button", { name: "Item actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Ignore" }));
    expect(onToggleIgnore).toHaveBeenCalledWith(2);
  });
});