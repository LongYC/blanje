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
  const onMoveItemDown = vi.fn();

  const view = render(
    <MonthlyItemsTable
      categoryGroups={categoryGroups}
      accounts={accounts}
      hiddenAccountIds={[]}
      grandTotal={grandTotal}
      budgets={{ food: "7.00", travel: "10.00" }}
      viewMode={viewMode}
      onAddItem={onAddItem}
      onEditItem={onEditItem}
      onToggleIgnore={onToggleIgnore}
      onMoveItemDown={onMoveItemDown}
    />,
  );

  return { ...view, onAddItem, onEditItem, onToggleIgnore, onMoveItemDown };
}

describe("MonthlyItemsTable", () => {
  it("renders a separate headed table for every category, including empty categories", () => {
    renderTable("category");

    const tables = screen.getAllByRole("table");
    expect(tables).toHaveLength(3);
    const categoryNames = [
      "Food",
      "Home",
      "Travel",
    ];
    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual(categoryNames);
    tables.forEach((table, index) => {
      const heading = screen.getByRole("heading", { name: categoryNames[index] });
      expect(table.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
      expect(table.getAttribute("aria-labelledby")).toBe(heading.id);
      expect(screen.getByRole("table", { name: categoryNames[index] })).toBe(table);
      expect(within(table).getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
        "Item",
        "Spent",
        "Account",
      ]);
    });
    expect(screen.getByRole("region", { name: "Food" }).textContent).toContain("5.50");
    expect(screen.getByRole("region", { name: "Food" }).textContent).toContain("31.4%");
    expect(screen.getByRole("region", { name: "Food" }).textContent).toContain("Budget left1.50");
    expect(screen.getByRole("region", { name: "Travel" }).textContent).toContain("Over budget-2.00");
    expect(screen.getByRole("region", { name: "Home" }).textContent).toContain("0.00");
    expect(within(tables[0]!).getByText("Coffee")).toBeTruthy();
    expect(within(tables[0]!).getByText("Tea")).toBeTruthy();
    expect(within(tables[1]!).getByText("No spendings")).toBeTruthy();
    expect(within(tables[2]!).getByText("Train")).toBeTruthy();
  });

  it("allows moving the first category item down", async () => {
    const user = userEvent.setup();
    const { onMoveItemDown } = renderTable("category");
    const foodTable = screen.getByRole("table", { name: "Food" });
    const names = Array.from(foodTable.querySelectorAll("tbody tr td:first-child"))
      .map((cell) => cell.textContent?.trim())
      .filter((name) => ["Coffee", "Tea"].includes(name ?? ""));

    expect(names).toEqual(["Coffee", "Tea"]);

    const teaRow = within(foodTable).getByRole("row", { name: /Tea/ });
    await user.click(within(teaRow).getByRole("button", { name: "Item actions" }));
    expect(screen.queryByRole("menuitem", { name: "Move down" })).toBeNull();

    const coffeeRow = within(foodTable).getByRole("row", { name: /Coffee/ });
    await user.click(within(coffeeRow).getByRole("button", { name: "Item actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Move down" }));
    expect(onMoveItemDown).toHaveBeenCalledWith(0);
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