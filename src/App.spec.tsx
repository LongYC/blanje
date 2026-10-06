// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
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
});

function changeView(mode: "category" | "name") {
  fireEvent.change(screen.getByLabelText("Monthly view mode"), {
    target: { value: mode },
  });
}

describe("App monthly table views", () => {
  it("shows monthly totals without letting under-budget categories offset overspending", () => {
    render(<App />);

    const summary = screen.getByRole("group", { name: "Monthly totals" });
    expect(summary.querySelectorAll("dt")).toHaveLength(4);
    expect(Array.from(summary.querySelectorAll("dd"), (value) => value.textContent)).toEqual([
      "17.00",
      "2.00",
      "19.00",
      "17.50"
    ]);
  });

  it("sums only positive remaining budget across budgeted categories", () => {
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

    const summary = screen.getByRole("group", { name: "Monthly totals" });
    expect(Array.from(summary.querySelectorAll("dd"), (value) => value.textContent)).toEqual([
      "500.00",
      "60.00",
      "560.00",
      "437.00"
    ]);
  });

  it("shows zero budget and the negative spent total when no budgets are configured", () => {
    const userDataWithoutBudgets: UserData = {
      ...userData,
      spendings: userData.spendings.map((spending) => ({ ...spending, budgets: {} })),
    };
    localStorage.setItem("blanje:user_data", JSON.stringify(userDataWithoutBudgets));
    render(<App />);

    const summary = screen.getByRole("group", { name: "Monthly totals" });
    expect(Array.from(summary.querySelectorAll("dd"), (value) => value.textContent)).toEqual([
      "0.00",
      "0.00",
      "0.00",
      "17.50"
    ]);
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