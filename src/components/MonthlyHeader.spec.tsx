// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { MonthlyHeader } from "./MonthlyHeader";

afterEach(() => {
  cleanup();
});

describe("MonthlyHeader totals disclosure", () => {
  it("shows primary totals by default and toggles the breakdown with pointer and keyboard", async () => {
    const user = userEvent.setup();
    render(
      <MonthlyHeader
        month={1}
        year={2026}
        totalBudgetInCents={1700}
        totalSpentInCents={1750}
        totalUnbudgetedSpentInCents={200}
        isPrevHidden={false}
        isNextHidden={false}
        onPrev={() => {}}
        onNext={() => {}}
      />,
    );

    const expectedSpentButton = screen.getByRole("button", {
      name: "Expected spent 19.00, show budget breakdown",
    });
    const breakdown = document.getElementById("monthly-spending-breakdown");

    expect(screen.getByText("Current spent")).toBeTruthy();
    expect(breakdown?.hidden).toBe(true);
    expect(expectedSpentButton.getAttribute("aria-controls")).toBe(breakdown?.id);
    expect(expectedSpentButton.getAttribute("aria-expanded")).toBe("false");

    await user.click(expectedSpentButton);
    expect(breakdown?.hidden).toBe(false);
    expect(screen.getByText("Budget")).toBeTruthy();
    expect(screen.getByText("Unbudgeted spent")).toBeTruthy();
    expect(expectedSpentButton.getAttribute("aria-expanded")).toBe("true");

    expectedSpentButton.focus();
    await user.keyboard("{Enter}");
    expect(breakdown?.hidden).toBe(true);
    expect(expectedSpentButton.getAttribute("aria-expanded")).toBe("false");
  });
});