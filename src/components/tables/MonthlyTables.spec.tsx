// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Account, Category, Item } from "../../data";
import { groupItemsByCategory } from "../../group";
import { CategoryItemsTable } from "./CategoryItemsTable";
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

const { categoryGroups, grandTotal } = groupItemsByCategory(items, categories, accounts);

afterEach(() => {
  cleanup();
});

function createHandlers() {
  return {
    onAddItem: vi.fn(),
    onEditItem: vi.fn(),
    onCancelEdit: vi.fn(),
    onStartEdit: vi.fn(),
    onToggleIgnore: vi.fn(),
    onMoveItemDown: vi.fn(),
  };
}

function renderCategoryTables() {
  const handlers = createHandlers();
  const view = render(
    <>
      {categoryGroups.map((categoryGroup) => (
        <CategoryItemsTable
          key={categoryGroup.categoryId}
          categoryGroup={categoryGroup}
          accounts={accounts}
          hidden={new Set()}
          grandTotal={grandTotal}
          editingIndex={null}
          budgetInCents={categoryGroup.categoryId === "food" ? 700 : categoryGroup.categoryId === "travel" ? 1000 : undefined}
          {...handlers}
        />
      ))}
    </>,
  );

  return { ...view, ...handlers };
}

function renderSortedTable() {
  const handlers = createHandlers();
  const view = render(
    <SortedItemsTable
      items={categoryGroups.flatMap((categoryGroup) => categoryGroup.groupedItems)}
      accounts={accounts}
      hidden={new Set()}
      grandTotal={grandTotal}
      editingIndex={null}
      {...handlers}
    />,
  );

  return { ...view, ...handlers };
}

describe("CategoryItemsTable", () => {
  it("renders a separate headed table for every category, including empty categories", () => {
    renderCategoryTables();

    const tables = screen.getAllByRole("table");
    const categoryNames = ["Food", "Home", "Travel"];
    expect(tables).toHaveLength(3);
    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual(categoryNames);
    tables.forEach((table, index) => {
      const heading = screen.getByRole("heading", { name: categoryNames[index] });
      expect(table.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
      expect(table.getAttribute("aria-labelledby")).toBe(heading.id);
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

  it("allows moving an item down within its category", async () => {
    const user = userEvent.setup();
    const { onMoveItemDown } = renderCategoryTables();
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
});

describe("SortedItemsTable", () => {
  it("renders one accessible table with name-sorted items", () => {
    renderSortedTable();

    const table = screen.getByRole("table", { name: "Items sorted by name" });
    expect(screen.getAllByRole("table")).toHaveLength(1);
    expect(within(table).getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
      "Item",
      "Spent",
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