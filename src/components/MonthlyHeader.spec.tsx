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

    const expectedTotalButton = screen.getByRole("button", {
      name: "Expected total 19.00, show budget breakdown",
    });
    const breakdown = document.getElementById("monthly-spending-breakdown");

    expect(screen.getByText("Recorded total")).toBeTruthy();
    expect(breakdown?.hidden).toBe(true);
    expect(expectedTotalButton.getAttribute("aria-controls")).toBe(breakdown?.id);
    expect(expectedTotalButton.getAttribute("aria-expanded")).toBe("false");

    await user.click(expectedTotalButton);
    expect(breakdown?.hidden).toBe(false);
    expect(screen.getByText("Budget total")).toBeTruthy();
    expect(screen.getByText("Unbudgeted total")).toBeTruthy();
    expect(expectedTotalButton.getAttribute("aria-expanded")).toBe("true");

    expectedTotalButton.focus();
    await user.keyboard("{Enter}");
    expect(breakdown?.hidden).toBe(true);
    expect(expectedTotalButton.getAttribute("aria-expanded")).toBe("false");
  });
});