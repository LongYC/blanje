// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ItemMenu } from "./ItemMenu";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("ItemMenu delete action", () => {
  it("starts as Allow delete, locks during the hold, and deletes on the second click", async () => {
    vi.useFakeTimers();
    const onDelete = vi.fn();
    render(
      <ItemMenu
        isItemIgnored={false}
        isLastInCategory={false}
        onEdit={vi.fn()}
        onMoveDown={vi.fn()}
        onToggleIgnore={vi.fn()}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Item actions" }));
    const deleteButton = screen.getByRole("menuitem", { name: "Allow delete" }) as HTMLButtonElement;
    expect(deleteButton.getAttribute("aria-disabled")).toBe("false");

    fireEvent.click(deleteButton);
    expect(deleteButton.getAttribute("aria-disabled")).toBe("true");
    expect(onDelete).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(5000));
    expect((screen.getByRole("menuitem", { name: "Allow delete" }) as HTMLButtonElement).getAttribute("aria-disabled")).toBe("true");
    act(() => vi.advanceTimersByTime(100));
    expect((screen.getByRole("menuitem", { name: "Delete" }) as HTMLButtonElement).getAttribute("aria-disabled")).toBe("false");

    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("resets the hold when the menu closes", async () => {
    vi.useFakeTimers();
    render(
      <ItemMenu
        isItemIgnored={false}
        isLastInCategory={false}
        onEdit={vi.fn()}
        onMoveDown={vi.fn()}
        onToggleIgnore={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Item actions" });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("menuitem", { name: "Allow delete" }));
    act(() => vi.advanceTimersByTime(1500));
    fireEvent.click(trigger);
    fireEvent.click(trigger);

    const reopenedDeleteButton = screen.getByRole("menuitem", { name: "Allow delete" }) as HTMLButtonElement;
    expect(reopenedDeleteButton.getAttribute("aria-disabled")).toBe("false");
    fireEvent.click(reopenedDeleteButton);
    act(() => vi.advanceTimersByTime(5100));
    expect((screen.getByRole("menuitem", { name: "Delete" }) as HTMLButtonElement).getAttribute("aria-disabled")).toBe("false");
  });
});