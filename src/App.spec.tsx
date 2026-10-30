// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UserData } from "./data";
import { App } from "./App";

const userData: UserData = {
  accounts: [{ id: "card", name: "Card" }],
  categories: [
    { id: "food", name: "Food" },
    { id: "home", name: "Home" },
    { id: "travel", name: "Travel" },
  ],
  spendings: [{
    month: 202601,
    budgets: { food: "7.00", travel: "10.00" },
    items: [
      { categoryId: "food", name: "Coffee", amount: "3.50", accountId: "card" },
      { categoryId: "food", name: "Tea", amount: "2.00", accountId: "card" },
      { categoryId: "travel", name: "Train", amount: "12.00", accountId: "card" },
    ],
  }],
};

beforeEach(() => {
  localStorage.setItem("blanje:user_data", JSON.stringify(userData));
  localStorage.setItem("blanje:app_data", JSON.stringify({ lastLoadedFilename: "spendings.json" }));
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.useRealTimers();
});

function changeView(mode: "category" | "name") {
  fireEvent.change(screen.getByLabelText("Monthly view mode"), {
    target: { value: mode },
  });
}

async function expandMonthlyBreakdown() {
  await userEvent.click(screen.getByRole("button", { name: /show budget breakdown/i }));
}

function getMonthlyTotals() {
  const summary = screen.getByRole("group", { name: "Monthly totals" });
  return Object.fromEntries(
    Array.from(summary.querySelectorAll("dt"), (term) => [
      term.textContent,
      term.nextElementSibling?.textContent,
    ]),
  );
}

describe("App monthly table views", () => {
  it("shows monthly totals without letting under-budget categories offset overspending", async () => {
    render(<App />);

    await expandMonthlyBreakdown();
    expect(getMonthlyTotals()).toEqual({
      "Budget total": "17.00",
      "Expected total": "19.00",
      "Recorded total": "17.50",
      "Unbudgeted total": "2.00",
    });
  });

  it("sums only positive remaining budget across budgeted categories", async () => {
    const categoriesWithDifferentBalances: UserData = {
      ...userData,
      categories: [
        { id: "a", name: "A" },
        { id: "b", name: "B" },
        { id: "c", name: "C" },
        { id: "d", name: "D" },
      ],
      spendings: [{
        month: 202601,
        budgets: { a: "200.00", b: "100.00", c: "100.00", d: "100.00" },
        items: [
          { categoryId: "a", name: "A item", amount: "77.00", accountId: "card" },
          { categoryId: "b", name: "B item", amount: "100.00", accountId: "card" },
          { categoryId: "c", name: "C item", amount: "120.00", accountId: "card" },
          { categoryId: "d", name: "D item", amount: "140.00", accountId: "card" },
        ],
      }],
    };
    localStorage.setItem("blanje:user_data", JSON.stringify(categoriesWithDifferentBalances));
    render(<App />);

    await expandMonthlyBreakdown();
    expect(getMonthlyTotals()).toEqual({
      "Budget total": "500.00",
      "Expected total": "560.00",
      "Recorded total": "437.00",
      "Unbudgeted total": "60.00",
    });
  });

  it("shows zero budget and the negative total when no budgets are configured", async () => {
    const userDataWithoutBudgets: UserData = {
      ...userData,
      spendings: userData.spendings.map((spending) => ({ ...spending, budgets: {} })),
    };
    localStorage.setItem("blanje:user_data", JSON.stringify(userDataWithoutBudgets));
    render(<App />);

    await expandMonthlyBreakdown();
    expect(getMonthlyTotals()).toEqual({
      "Budget total": "0.00",
      "Expected total": "17.50",
      "Recorded total": "17.50",
      "Unbudgeted total": "17.50",
    });
  });

  it("includes spending from categories without budgets", async () => {
    const dataWithUnbudgetedSpending: UserData = {
      ...userData,
      spendings: userData.spendings.map((spending) => ({
        ...spending,
        items: [
          ...spending.items,
          { categoryId: "home", name: "Supplies", amount: "4.25", accountId: "card" },
        ],
      })),
    };
    localStorage.setItem("blanje:user_data", JSON.stringify(dataWithUnbudgetedSpending));
    render(<App />);

    await expandMonthlyBreakdown();
    expect(getMonthlyTotals()).toEqual({
      "Budget total": "17.00",
      "Expected total": "23.25",
      "Recorded total": "21.75",
      "Unbudgeted total": "6.25",
    });
  });

  it("persists item and note changes only in the selected month", async () => {
    const user = userEvent.setup();
    const otherMonth = { month: 202602, note: "Other month", items: [...userData.spendings[0]!.items] };
    localStorage.setItem("blanje:user_data", JSON.stringify({
      ...userData,
      spendings: [...userData.spendings, otherMonth],
    }));
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Food item list menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Show items" }));
    const coffeeRow = screen.getByRole("row", { name: /Coffee/ });
    await user.click(within(coffeeRow).getByRole("button", { name: "Item actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit" }));
    const nameInput = screen.getByRole("textbox", { name: "New item name" });
    await user.clear(nameInput);
    await user.type(nameInput, "Espresso");
    await user.click(screen.getByRole("button", { name: "Update" }));

    const editedRow = screen.getByRole("row", { name: /Espresso/ });
    await user.click(within(editedRow).getByRole("button", { name: "Item actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Ignore" }));
    let savedData = JSON.parse(localStorage.getItem("blanje:user_data") ?? "null") as UserData;
    expect(savedData.spendings[0]?.items[0]).toMatchObject({ name: "Espresso", ignore: true });

    await user.click(within(screen.getByRole("row", { name: /Espresso/ })).getByRole("button", { name: "Item actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Unignore" }));
    savedData = JSON.parse(localStorage.getItem("blanje:user_data") ?? "null") as UserData;
    expect(savedData.spendings[0]?.items[0]).not.toHaveProperty("ignore");

    await user.click(within(screen.getByRole("row", { name: /Espresso/ })).getByRole("button", { name: "Item actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Move down" }));
    await user.click(screen.getByRole("button", { name: "Open add form for Food" }));
    await user.type(screen.getByRole("textbox", { name: "New item name" }), "Cake");
    await user.type(screen.getByRole("textbox", { name: "New amount" }), "4.00");
    await user.selectOptions(screen.getByRole("combobox", { name: "Account" }), "card");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: "Edit note" }));
    await user.type(screen.getByRole("textbox", { name: "Note" }), "Monthly note");

    savedData = JSON.parse(localStorage.getItem("blanje:user_data") ?? "null") as UserData;
    expect(savedData.spendings[0]?.items.map(({ name }) => name)).toEqual(["Cake", "Tea", "Espresso", "Train"]);
    expect(savedData.spendings[0]?.note).toBe("Monthly note");
    expect(savedData.spendings[1]).toEqual(otherMonth);
    const appData = JSON.parse(localStorage.getItem("blanje:app_data") ?? "null") as { lastEdited: string };
    expect(appData.lastEdited).toMatch(/^\d{4}-\d{2}-\d{2}_\d{4}_\d{2}$/);
  });

  it("persists a category budget edit for the selected month only", async () => {
    const user = userEvent.setup();
    const dataWithSecondMonth: UserData = {
      ...userData,
      spendings: [
        ...userData.spendings,
        { month: 202602, budgets: { food: "99.00", home: "12.00" }, items: [] },
      ],
    };
    localStorage.setItem("blanje:user_data", JSON.stringify(dataWithSecondMonth));
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Food item list menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit budget" }));
    const budgetInput = screen.getByRole("textbox", { name: "Monthly budget" });
    await user.clear(budgetInput);
    await user.type(budgetInput, "9.50");
    await user.click(screen.getByRole("button", { name: "Update" }));

    const savedData = JSON.parse(localStorage.getItem("blanje:user_data") ?? "null") as UserData;
    expect(savedData.spendings[0]?.budgets).toEqual({ food: "9.50", travel: "10.00" });
    expect(savedData.spendings[1]?.budgets).toEqual({ food: "99.00", home: "12.00" });
  });

  it("deletes the correct original item in name-sorted view", async () => {
    vi.useFakeTimers();
    const dataWithReorderedItems: UserData = {
      ...userData,
      spendings: [
        {
          ...userData.spendings[0]!,
          items: [
            userData.spendings[0]!.items[1]!,
            userData.spendings[0]!.items[2]!,
            userData.spendings[0]!.items[0]!,
          ],
        },
        { month: 202602, budgets: { home: "12.00" }, items: [] },
      ],
    };
    localStorage.setItem("blanje:user_data", JSON.stringify(dataWithReorderedItems));
    render(<App />);
    changeView("name");

    const coffeeRow = screen.getByRole("row", { name: /Coffee/ });
    fireEvent.click(within(coffeeRow).getByRole("button", { name: "Item actions" }));
    const allowDeleteButton = screen.getByRole("menuitem", { name: "Allow delete" });
    fireEvent.click(allowDeleteButton);
    act(() => vi.advanceTimersByTime(5100));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));

    const savedData = JSON.parse(localStorage.getItem("blanje:user_data") ?? "null") as UserData;
    expect(savedData.spendings[0]?.items.map(({ name }) => name)).toEqual(["Tea", "Train"]);
    expect(savedData.spendings[0]?.budgets).toEqual({ food: "7.00", travel: "10.00" });
    expect(savedData.spendings[1]).toEqual({ month: 202602, budgets: { home: "12.00" }, items: [] });
  });

  it("disables month navigation while editing a category budget", async () => {
    const user = userEvent.setup();
    const dataWithThreeMonths: UserData = {
      ...userData,
      spendings: [
        ...userData.spendings,
        { month: 202602, budgets: { food: "99.00" }, items: [] },
        { month: 202603, budgets: {}, items: [] },
      ],
    };
    localStorage.setItem("blanje:user_data", JSON.stringify(dataWithThreeMonths));
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Next month" }));
    await user.click(screen.getByRole("button", { name: "Food item list menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit budget" }));
    expect(screen.getByRole("button", { name: "Previous month" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "Next month" }).hasAttribute("disabled")).toBe(true);

    await user.click(screen.getByRole("button", { name: "Keep" }));
    expect(screen.getByRole("button", { name: "Previous month" }).hasAttribute("disabled")).toBe(false);
    expect(screen.getByRole("button", { name: "Next month" }).hasAttribute("disabled")).toBe(false);
  });

  it("disables month navigation while editing an existing item", async () => {
    const user = userEvent.setup();
    const dataWithThreeMonths: UserData = {
      ...userData,
      spendings: [
        ...userData.spendings,
        { ...userData.spendings[0]!, month: 202602 },
        { month: 202603, budgets: {}, items: [] },
      ],
    };
    localStorage.setItem("blanje:user_data", JSON.stringify(dataWithThreeMonths));
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Next month" }));
    await user.click(screen.getByRole("button", { name: "Food item list menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Show items" }));
    const coffeeRow = within(screen.getByRole("table", { name: "Food" }))
      .getByRole("row", { name: /Coffee/ });
    await user.click(within(coffeeRow).getByRole("button", { name: "Item actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit" }));

    expect(screen.getByRole("button", { name: "Previous month" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "Next month" }).hasAttribute("disabled")).toBe(true);
  });

  it("removes a cleared category budget without dropping other budgets", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Food item list menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit budget" }));
    await user.clear(screen.getByRole("textbox", { name: "Monthly budget" }));
    await user.click(screen.getByRole("button", { name: "Update" }));

    const savedData = JSON.parse(localStorage.getItem("blanje:user_data") ?? "null") as UserData;
    expect(savedData.spendings[0]?.budgets).toEqual({ travel: "10.00" });
  });

  it("omits the budgets object when the last category budget is cleared", async () => {
    const user = userEvent.setup();
    const dataWithSingleBudget: UserData = {
      ...userData,
      spendings: userData.spendings.map((spending) => ({ ...spending, budgets: { food: "7.00" } })),
    };
    localStorage.setItem("blanje:user_data", JSON.stringify(dataWithSingleBudget));
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Food item list menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit budget" }));
    await user.clear(screen.getByRole("textbox", { name: "Monthly budget" }));
    await user.click(screen.getByRole("button", { name: "Update" }));

    const savedData = JSON.parse(localStorage.getItem("blanje:user_data") ?? "null") as UserData;
    expect(savedData.spendings[0]).not.toHaveProperty("budgets");
  });

  it("selects the category and name tables directly from the current view mode", () => {
    render(<App />);
    expect(screen.queryByRole("table", { name: "Food" })).toBeNull();
    expect(screen.queryByRole("table", { name: "Home" })).toBeNull();
    expect(screen.queryByRole("table", { name: "Travel" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Food item list menu" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Show items" }));
    expect(screen.getByRole("table", { name: "Food" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Home item list menu" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Show items" }));
    expect(screen.getByRole("table", { name: "Home" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Travel item list menu" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Show items" }));
    expect(screen.getByRole("table", { name: "Travel" })).toBeTruthy();

    changeView("name");
    expect(screen.getByRole("table", { name: "Items sorted by name" })).toBeTruthy();

    changeView("category");
    expect(screen.queryByRole("table", { name: "Food" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Food item list menu" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Show items" }));
    expect(screen.getByRole("table", { name: "Food" })).toBeTruthy();
  });

  it("keeps the active edit index across view changes", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Food item list menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Show items" }));
    const coffeeRow = within(screen.getByRole("table", { name: "Food" }))
      .getByRole("row", { name: /Coffee/ });
    await user.click(within(coffeeRow).getByRole("button", { name: "Item actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect((screen.getByRole("textbox", { name: "New item name" }) as HTMLInputElement).value).toBe("Coffee");

    changeView("name");
    expect(screen.getByRole("table", { name: "Items sorted by name" })).toBeTruthy();
    changeView("category");
    expect((screen.getByRole("textbox", { name: "New item name" }) as HTMLInputElement).value).toBe("Coffee");

    await user.click(screen.getByRole("button", { name: "Travel item list menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Show items" }));
    const trainRow = within(screen.getByRole("table", { name: "Travel" }))
      .getByRole("row", { name: /Train/ });
    expect(within(trainRow).getByRole("button", { name: "Item actions" }).hasAttribute("disabled")).toBe(true);
  });
});