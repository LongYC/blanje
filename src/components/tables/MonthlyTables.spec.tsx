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
    onEditBudget: vi.fn(),
    onBudgetEditorStateChange: vi.fn(),
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
          budgetAmount={categoryGroup.categoryId === "food" ? "7.00" : categoryGroup.categoryId === "travel" ? "10.00" : undefined}
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
  it("starts with each item table hidden while keeping category heading visible", () => {
    renderCategoryTables();

    const categoryNames = ["Food", "Home", "Travel"];
    expect(screen.queryAllByRole("table")).toHaveLength(0);
    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual(categoryNames);
    categoryNames.forEach((categoryName) => {
      const toggle = screen.getByRole("button", { name: `Open add form for ${categoryName}` });
      expect(toggle.getAttribute("aria-expanded")).toBe("false");
      expect(toggle.textContent).toBe("+");
    });
  });

  it("opens the add form without showing the item list", async () => {
    const user = userEvent.setup();
    renderCategoryTables();

    await user.click(screen.getByRole("button", { name: "Open add form for Food" }));

    const foodTable = screen.getByRole("table", { name: "Food" });
    const nameInput = within(foodTable).getByRole("textbox", { name: "New item name" });
    expect(nameInput).toBeTruthy();
    expect(document.activeElement).toBe(nameInput);
    expect(screen.queryByRole("button", { name: "Open add form for Food" })).toBeNull();
    expect(within(foodTable).queryAllByRole("columnheader")).toHaveLength(0);
    expect(within(foodTable).queryByText("Coffee")).toBeNull();
    expect(screen.queryByRole("table", { name: "Home" })).toBeNull();

    await user.click(within(foodTable).getByRole("button", { name: "Discard" }));
    expect(screen.getByRole("button", { name: "Open add form for Food" })).toBeTruthy();
    expect(screen.queryByRole("table", { name: "Food" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Open add form for Food" }));
    expect(document.activeElement).toBe(
      within(screen.getByRole("table", { name: "Food" })).getByRole("textbox", { name: "New item name" }),
    );
  });

  it("expands category tables independently", async () => {
    const user = userEvent.setup();
    renderCategoryTables();

    await user.click(screen.getByRole("button", { name: "Food item list menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Show items" }));
    const foodTable = screen.getByRole("table", { name: "Food" });
    const foodMenuButton = screen.getByRole("button", { name: "Food item list menu" });
    expect(foodMenuButton.getAttribute("aria-expanded")).toBe("false");
    expect(foodTable.getAttribute("aria-labelledby")).toBe(screen.getByRole("heading", { name: "Food" }).id);
    expect(within(foodTable).getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
      "Item",
      "Spent",
      "Account",
    ]);
    expect(within(foodTable).getByText("Coffee")).toBeTruthy();
    expect(within(foodTable).getByText("Tea")).toBeTruthy();
    expect(screen.queryByRole("table", { name: "Home" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Home item list menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Show items" }));
    expect(within(screen.getByRole("table", { name: "Home" })).getByText("No spendings")).toBeTruthy();
    expect(screen.queryByRole("table", { name: "Travel" })).toBeNull();

    await user.click(foodMenuButton);
    await user.click(screen.getByRole("menuitem", { name: "Hide items" }));
    expect(screen.queryByRole("table", { name: "Food" })).toBeNull();
    expect(screen.getByRole("button", { name: "Food item list menu" })).toBeTruthy();
  });

  it("edits an existing category budget from the menu", async () => {
    const user = userEvent.setup();
    const { onEditBudget } = renderCategoryTables();

    await user.click(screen.getByRole("button", { name: "Food item list menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit budget" }));

    const budgetInput = screen.getByRole("textbox", { name: "Monthly budget" }) as HTMLInputElement;
    expect(budgetInput.value).toBe("7.00");
    expect(document.activeElement).toBe(budgetInput);
    expect(screen.getByRole("button", { name: "Keep" })).toBeTruthy();
    await user.clear(budgetInput);
    await user.type(budgetInput, "8.25");
    expect(screen.getByRole("button", { name: "Update" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Update" }));

    expect(onEditBudget).toHaveBeenCalledWith("food", "8.25");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Food item list menu" }));
  });

  it("adds a category budget and rejects invalid values", async () => {
    const user = userEvent.setup();
    const { onEditBudget } = renderCategoryTables();

    await user.click(screen.getByRole("button", { name: "Home item list menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Set budget" }));
    const budgetInput = screen.getByRole("textbox", { name: "Monthly budget" });
    expect((budgetInput as HTMLInputElement).value).toBe("");
    await user.type(budgetInput, "-1.00");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByRole("alert").textContent).toContain("nonnegative");
    expect(onEditBudget).not.toHaveBeenCalled();

    await user.clear(budgetInput);
    await user.type(budgetInput, "1.001");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByRole("alert").textContent).toContain("up to 2 decimal places");
    expect(onEditBudget).not.toHaveBeenCalled();

    await user.clear(budgetInput);
    await user.type(budgetInput, "4.25");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(onEditBudget).toHaveBeenCalledWith("home", "4.25");
  });

  it("uses discard for a new budget and discards without saving", async () => {
    const user = userEvent.setup();
    const { onEditBudget } = renderCategoryTables();

    await user.click(screen.getByRole("button", { name: "Home item list menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Set budget" }));
    const budgetInput = screen.getByRole("textbox", { name: "Monthly budget" });
    expect(screen.getByRole("button", { name: "Add" }).getAttribute("aria-disabled")).toBe("true");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByRole("textbox", { name: "Monthly budget" })).toBe(budgetInput);
    expect(onEditBudget).not.toHaveBeenCalled();
    await user.type(budgetInput, "4.25");
    await user.click(screen.getByRole("button", { name: "Discard" }));

    expect(onEditBudget).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox", { name: "Monthly budget" })).toBeNull();
  });

  it("undoes changes to an existing budget and keeps the original value", async () => {
    const user = userEvent.setup();
    const { onEditBudget } = renderCategoryTables();

    await user.click(screen.getByRole("button", { name: "Food item list menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit budget" }));
    const budgetInput = screen.getByRole("textbox", { name: "Monthly budget" }) as HTMLInputElement;
    await user.clear(budgetInput);
    await user.type(budgetInput, "8.25");
    await user.click(screen.getByRole("button", { name: "Undo" }));

    expect(budgetInput.value).toBe("7.00");
    await user.click(screen.getByRole("button", { name: "Keep" }));
    expect(onEditBudget).not.toHaveBeenCalled();
  });

  it("keeps the add form open when expanding the item list", async () => {
    const user = userEvent.setup();
    renderCategoryTables();

    await user.click(screen.getByRole("button", { name: "Open add form for Food" }));
    await user.click(screen.getByRole("button", { name: "Food item list menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Show items" }));

    const foodTable = screen.getByRole("table", { name: "Food" });
    expect(within(foodTable).getByRole("textbox", { name: "New item name" })).toBeTruthy();
    expect(within(foodTable).getByText("Coffee")).toBeTruthy();
  });

  it("keeps a category expanded while one of its items is being edited", () => {
    renderCategoryTables(0);

    expect(screen.getByRole("table", { name: "Food" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Food item list menu" }).hasAttribute("disabled")).toBe(true);
  });

  it("allows moving an item down within its category", async () => {
    const user = userEvent.setup();
    const { onMoveItemDown } = renderCategoryTables();
    await user.click(screen.getByRole("button", { name: "Food item list menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Show items" }));
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
