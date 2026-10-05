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

function renderCategoryTables(editingIndex: number | null = null) {
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
          editingIndex={editingIndex}
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
  it("starts with each item table hidden while keeping category summaries visible", () => {
    renderCategoryTables();

    const categoryNames = ["Food", "Home", "Travel"];
    expect(screen.queryAllByRole("table")).toHaveLength(0);
    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual(categoryNames);
    expect(screen.getByRole("region", { name: "Food" }).textContent).toContain("5.50");
    expect(screen.getByRole("region", { name: "Food" }).textContent).toContain("31.4%");
    expect(screen.getByRole("region", { name: "Food" }).textContent).toContain("Budget left1.50");
    expect(screen.getByRole("region", { name: "Travel" }).textContent).toContain("Over budget-2.00");
    expect(screen.getByRole("region", { name: "Home" }).textContent).toContain("0.00");
    categoryNames.forEach((categoryName) => {
      expect(screen.getByRole("button", { name: `Expand ${categoryName} items` }).getAttribute("aria-expanded")).toBe("false");
    });
  });

  it("expands category tables independently", async () => {
    const user = userEvent.setup();
    renderCategoryTables();

    await user.click(screen.getByRole("button", { name: "Expand Food items" }));
    const foodTable = screen.getByRole("table", { name: "Food" });
    expect(foodTable.getAttribute("aria-labelledby")).toBe(screen.getByRole("heading", { name: "Food" }).id);
    expect(within(foodTable).getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
      "Item",
      "Spent",
      "Account",
    ]);
    expect(within(foodTable).getByText("Coffee")).toBeTruthy();
    expect(within(foodTable).getByText("Tea")).toBeTruthy();
    expect(screen.queryByRole("table", { name: "Home" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Expand Home items" }));
    expect(within(screen.getByRole("table", { name: "Home" })).getByText("No spendings")).toBeTruthy();
    expect(screen.queryByRole("table", { name: "Travel" })).toBeNull();
  });

  it("keeps a category expanded while one of its items is being edited", () => {
    renderCategoryTables(0);

    expect(screen.getByRole("table", { name: "Food" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Collapse Food items" }).hasAttribute("disabled")).toBe(true);
  });

  it("allows moving an item down within its category", async () => {
    const user = userEvent.setup();
    const { onMoveItemDown } = renderCategoryTables();
    await user.click(screen.getByRole("button", { name: "Expand Food items" }));
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
