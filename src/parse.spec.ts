import { describe, expect, it } from "vitest";
import { parseRootJson, ValidationError } from "./parse";

function makeDocument(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    accounts: [{ id: "cash", name: "Cash" }],
    categories: [{ id: "food", name: "Food" }],
    spendings: [{ month: 202609, items: [] }],
    ...overrides,
  });
}

describe("parseRootJson", () => {
  it("normalizes valid values while preserving optional data", () => {
    expect(
      parseRootJson(
        makeDocument({
          spendings: [
            {
              month: 202609,
              note: "September",
              budgets: { food: "120.00" },
              items: [
                { categoryId: "food", name: "Lunch", amount: 12.5, accountId: "cash", ignore: true, labels: ["work"] },
                { categoryId: "food", name: "Tea", amount: "2.00", accountId: "cash", ignore: false },
              ],
            },
          ],
        }),
      ),
    ).toEqual({
      accounts: [{ id: "cash", name: "Cash" }],
      categories: [{ id: "food", name: "Food" }],
      spendings: [
        {
          month: 202609,
          note: "September",
          budgets: { food: "120.00" },
          items: [
            { categoryId: "food", name: "Lunch", amount: "12.5", accountId: "cash", ignore: true, labels: ["work"] },
            { categoryId: "food", name: "Tea", amount: "2.00", accountId: "cash" },
          ],
        },
      ],
    });
  });

  it.each([
    ["not json", 'File is not valid JSON: Unexpected token \'o\', "not json" is not valid JSON'],
    ["null", "Top-level JSON must be an object"],
    ["[]", "Top-level JSON must be an object"],
    [makeDocument({ accounts: {} }), "accounts must be an array"],
    [makeDocument({ categories: {} }), "categories must be an array"],
    [makeDocument({ spendings: {} }), "spendings must be an array"],
    [makeDocument({ accounts: [null] }), "accounts[0] must be an object"],
    [makeDocument({ accounts: [{ id: "", name: "Cash" }] }), "accounts[0].id must be a non-empty string"],
    [makeDocument({ categories: [{ id: 1, name: "Food" }] }), "categories[0].id must be a non-empty string"],
    [makeDocument({ accounts: [{ id: "cash", name: 2 }] }), "accounts[0].name must be a string"],
    [makeDocument({ spendings: [null] }), "spendings[0] must be an object"],
    [makeDocument({ spendings: [{ month: "202609", items: [] }] }), "spendings[0].month must be an integer (e.g. 202607)"],
    [makeDocument({ spendings: [{ month: 202609.5, items: [] }] }), "spendings[0].month must be an integer (e.g. 202607)"],
    [makeDocument({ spendings: [{ month: 202600, items: [] }] }), "spendings[0].month must encode a month 1-12, e.g. 202607"],
    [makeDocument({ spendings: [{ month: 202613, items: [] }] }), "spendings[0].month must encode a month 1-12, e.g. 202607"],
    [makeDocument({ spendings: [{ month: 202609 }] }), "spendings[0].items must be an array"],
    [makeDocument({ spendings: [{ month: 202609, items: [null] }] }), "spendings[0].items[0] must be an object"],
    [makeDocument({ spendings: [{ month: 202609, items: [{ name: "Lunch" }] }] }), "spendings[0].items[0].categoryId must be a string"],
    [makeDocument({ spendings: [{ month: 202609, items: [{ categoryId: "food", amount: "1" }] }] }), "spendings[0].items[0].name must be a string"],
    [makeDocument({ spendings: [{ month: 202609, items: [{ categoryId: "food", name: "Lunch", amount: null }] }] }), "spendings[0].items[0].amount must be a string or number"],
    [makeDocument({ spendings: [{ month: 202609, items: [{ categoryId: "food", name: "Lunch", amount: "abc" }] }] }), 'spendings[0].items[0].amount "abc" is not a valid number'],
    [makeDocument({ spendings: [{ month: 202609, items: [{ categoryId: "food", name: "Lunch", amount: "1", accountId: 2 }] }] }), "spendings[0].items[0].accountId must be a string"],
    [makeDocument({ spendings: [{ month: 202609, items: [{ categoryId: "food", name: "Lunch", amount: "1", accountId: "cash", ignore: "true" }] }] }), "spendings[0].items[0].ignore must be a boolean"],
    [makeDocument({ spendings: [{ month: 202609, items: [{ categoryId: "food", name: "Lunch", amount: "1", accountId: "cash", labels: [1] }] }] }), "spendings[0].items[0].labels must be an array of strings"],
    [makeDocument({ spendings: [{ month: 202609, budgets: "invalid", items: [] }] }), "spendings[0].budgets must be an object"],
    [makeDocument({ spendings: [{ month: 202609, budgets: { food: 12 }, items: [] }] }), "spendings[0].budgets.food must be a string to preserve precision"],
    [makeDocument({ spendings: [{ month: 202609, budgets: { food: "abc" }, items: [] }] }), 'spendings[0].budgets.food "abc" is not a valid number'],
    [makeDocument({ spendings: [{ month: 202609, items: [], note: 12 }] }), "spendings[0].note must be a string"],
  ])("rejects invalid input with a useful path: %s", (input, message) => {
    expect(() => parseRootJson(input)).toThrow(new ValidationError(message));
  });
});