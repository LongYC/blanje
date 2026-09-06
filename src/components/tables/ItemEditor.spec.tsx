// @vitest-environment jsdom
import type { ComponentProps } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ItemEditor } from "./ItemEditor";
import type { Account, Item } from "../../data";
import type { GroupedItem } from "../../group";

const accountOptions: Account[] = [
  { id: "checking", name: "Checking" },
  { id: "savings", name: "Savings" },
];

afterEach(() => {
  cleanup();
});

function renderEditor(props: Partial<ComponentProps<typeof ItemEditor>> = {}) {
  const onAddOrUpdate = vi.fn();
  const onCancelOrKeep = vi.fn();

  const view = render(
    <table>
      <tbody>
        <ItemEditor
          categoryId="food"
          accountOptions={accountOptions}
          onAddOrUpdate={onAddOrUpdate}
          onCancelOrKeep={onCancelOrKeep}
          {...props}
        />
      </tbody>
    </table>,
  );

  return { ...view, onAddOrUpdate, onCancelOrKeep };
}

describe("ItemEditor", () => {
  it("opens the editor from the add button and closes after a valid submit", async () => {
    const user = userEvent.setup();
    const { onAddOrUpdate } = renderEditor();

    const addButton = screen.getByRole("button", { name: /add a new item to this category/i });
    expect(addButton).toBeTruthy();
    expect(screen.queryByLabelText("New item name")).toBeNull();

    await user.click(addButton);

    const nameInput = screen.getByLabelText("New item name");
    const amountInput = screen.getByLabelText("New amount");
    const accountSelect = screen.getByLabelText("Account");

    await user.type(nameInput, "  Coffee  ");
    await user.type(amountInput, "3.50");
    await user.selectOptions(accountSelect, "checking");
    await user.type(screen.getByLabelText("Labels"), "milk, milk, sugar");
    await user.click(screen.getByRole("button", { name: /add/i }));

    expect(onAddOrUpdate).toHaveBeenCalledWith({
      categoryId: "food",
      name: "Coffee",
      amount: "3.50",
      accountId: "checking",
      labels: ["milk", "sugar"],
    });
    expect(screen.queryByLabelText("New item name")).toBeNull();
  });

  it("includes the editor buttons in the keyboard tab order", async () => {
    const user = userEvent.setup();
    renderEditor({ isOpenByDefault: true });

    expect(document.activeElement).toBe(screen.getByLabelText("New item name"));

    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: /toggle negative amount/i }),
    );

    await user.tab();
    expect(document.activeElement).toBe(screen.getByLabelText("New amount"));

    await user.tab();
    expect(document.activeElement).toBe(screen.getByLabelText("Account"));

    await user.tab();
    expect(document.activeElement).toBe(screen.getByLabelText("Labels"));

    await user.tab();
    const submitButton = screen.getByRole("button", { name: /^add$/i });
    expect(submitButton.getAttribute("aria-disabled")).toBe("true");
    expect(document.activeElement).toBe(submitButton);

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /cancel/i }));
  });

  it("does not submit when the form is invalid", async () => {
    const user = userEvent.setup();
    const { onAddOrUpdate } = renderEditor();

    await user.click(screen.getByRole("button", { name: /add a new item to this category/i }));
    await user.type(screen.getByLabelText("New amount"), "5.00");
    await user.selectOptions(screen.getByLabelText("Account"), "checking");
    await user.click(screen.getByRole("button", { name: /^add$/i }));

    expect(onAddOrUpdate).not.toHaveBeenCalled();
    expect(screen.getByLabelText("New item name")).toBeTruthy();
  });

  it("shows the disabled add button state when the editor is disabled", () => {
    renderEditor({ isAddButtonDisabled: true });

    const button = screen.getByRole("button", { name: /add a new item to this category/i });
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(screen.queryByLabelText("New item name")).toBeNull();
  });

  it("cancels a new entry and clears the form", async () => {
    const user = userEvent.setup();
    const { onCancelOrKeep } = renderEditor();

    await user.click(screen.getByRole("button", { name: /add a new item to this category/i }));
    await user.type(screen.getByLabelText("New item name"), "Lunch");
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onCancelOrKeep).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText("New item name")).toBeNull();
  });

  it("toggles the amount sign before submitting", async () => {
    const user = userEvent.setup();
    const { onAddOrUpdate } = renderEditor();

    await user.click(screen.getByRole("button", { name: /add a new item to this category/i }));
    await user.type(screen.getByLabelText("New item name"), "Taxi");
    await user.click(screen.getByRole("button", { name: /toggle negative amount/i }));
    await user.type(screen.getByLabelText("New amount"), "12.00");
    await user.selectOptions(screen.getByLabelText("Account"), "checking");
    await user.click(screen.getByRole("button", { name: /^add$/i }));

    expect(onAddOrUpdate).toHaveBeenCalledWith({
      categoryId: "food",
      name: "Taxi",
      amount: "-12.00",
      accountId: "checking",
      labels: [],
    });
  });

  it("supports editing an existing item with undo and update flow", async () => {
    const user = userEvent.setup();
    const { onAddOrUpdate } = renderEditor({
      isOpenByDefault: true,
      groupedItemInEdit: {
        categoryId: "food",
        name: "Original",
        amount: "5.00",
        accountId: "checking",
        labels: ["old"],
        accountName: "Checking",
        amountCents: 500,
        index: 0,
      } satisfies GroupedItem,
    });

    const undoButton = screen.getByRole("button", { name: /undo/i });
    expect(undoButton.getAttribute("aria-disabled")).toBe("true");

    await user.tab();
    await user.tab();
    await user.tab();
    await user.tab();
    await user.tab();
    await user.tab();
    expect(document.activeElement).toBe(undoButton);

    const nameInput = screen.getByLabelText("New item name") as HTMLInputElement;
    await user.clear(nameInput);
    await user.type(nameInput, "Updated");

    expect(screen.getByRole("button", { name: /^update$/i })).toBeTruthy();
    expect(undoButton.hasAttribute("disabled")).toBe(false);

    await user.click(undoButton);
    expect(nameInput.value).toBe("Original");

    await user.clear(nameInput);
    await user.type(nameInput, "Updated again");
    await user.click(screen.getByRole("button", { name: /^update$/i }));

    expect(onAddOrUpdate).toHaveBeenCalledWith({
      categoryId: "food",
      name: "Updated again",
      amount: "5.00",
      accountId: "checking",
      labels: ["old"],
    } satisfies Item);
  });
});
