// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadJson } from "./download";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("downloadJson", () => {
  it("groups exported items by category and sorts months descending without mutating input", async () => {
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:download");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const data = {
      accounts: [],
      categories: [
        { id: "food", name: "Food" },
        { id: "home", name: "Home" },
        { id: "travel", name: "Travel" },
      ],
      spendings: [
        {
          month: 202608,
          items: [{ categoryId: "food", name: "Breakfast", amount: "4", accountId: "bank" }],
        },
        {
          month: 202610,
          items: [
            { categoryId: "home", name: "Rent", amount: "10", accountId: "bank" },
            { categoryId: "food", name: "Lunch", amount: "5", accountId: "bank" },
            { categoryId: "travel", name: "Train", amount: "3", accountId: "bank" },
            { categoryId: "food", name: "Coffee", amount: "2", accountId: "bank" },
            { categoryId: "unknown", name: "Other", amount: "1", accountId: "bank" },
          ],
        },
      ],
    };
    const originalMonths = data.spendings.map(({ month }) => month);
    const originalItems = [...data.spendings[1]!.items];

    downloadJson(data, "spendings.json");

    const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
    expect(blob.type).toBe("application/json");
    const downloadedData = JSON.parse(await blob.text());
    expect(downloadedData.spendings.map(({ month }: { month: number }) => month)).toEqual([
      202610,
      202608,
    ]);
    expect(downloadedData.spendings[0].items.map(({ name }: { name: string }) => name)).toEqual([
      "Lunch",
      "Coffee",
      "Rent",
      "Train",
      "Other",
    ]);
    expect(data.spendings.map(({ month }) => month)).toEqual(originalMonths);
    expect(data.spendings[1]!.items).toEqual(originalItems);
    expect(await blob.text()).toBe(JSON.stringify(downloadedData, null, 2));
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:download");
    expect(document.querySelector('a[download="spendings.json"]')).toBeNull();
  });
});