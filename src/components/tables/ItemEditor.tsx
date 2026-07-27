import { useState, type SubmitEvent } from "react";
import type { Account, Item } from "../../data";
import styles from "./ItemEditor.module.css";
import type { GroupedItem } from "../../group";

interface ItemEditorProps {
  categoryId: string;
  accountOptions: Account[];
  isAddButtonDisabled?: boolean;
  isOpenByDefault?: boolean;
  groupedItemInEdit?: GroupedItem;
  onAddOrUpdate: (item: Item) => void;
  onCancelOrKeep?: () => void;
}

export function ItemEditor({
  categoryId,
  accountOptions,
  isOpenByDefault = false,
  groupedItemInEdit,
  isAddButtonDisabled = false,
  onAddOrUpdate,
  onCancelOrKeep
}: ItemEditorProps) {
  const originalName = groupedItemInEdit?.name ?? "";
  const originalAmount = groupedItemInEdit?.amount ?? "";
  const originalAccountId = groupedItemInEdit?.accountId ?? "";
  const originalLabelsString = groupedItemInEdit?.labels?.join(", ") ?? "";

  const [isOpen, setIsOpen] = useState(isOpenByDefault);
  const [isAutofocus, setIsAutofocus] = useState(true);
  const [name, setName] = useState(originalName);
  const [amount, setAmount] = useState(originalAmount);
  const [accountId, setAccountId] = useState(originalAccountId);
  const [labelsString, setLabelsString] = useState(originalLabelsString);

  const hasChanges = Boolean(
    name !== originalName ||
    amount !== originalAmount ||
    accountId !== originalAccountId ||
    labelsString !== originalLabelsString
  );

  function undoChanges() {
    setName(originalName);
    setAmount(originalAmount);
    setAccountId(originalAccountId);
    setLabelsString(originalLabelsString);
  }

  function clearData() {
    setIsOpen(false);
    setName("");
    setAmount("");
    setAccountId("");
    setLabelsString("");
    onCancelOrKeep?.();
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();

    if (name.trim() === "" || Number.isNaN(Number(amount)) || accountId === "") {
      return;
    }

    if (!hasChanges) {
      clearData();
      return;
    }

    const parsedLabelsArray = labelsString
      .split(",")
      .map((label) => label.trim())
      .filter((label) => label !== "");

    onAddOrUpdate({
      categoryId,
      name: name.trim(),
      amount: amount.trim(),
      accountId,
      labels: [...new Set(parsedLabelsArray)]
    });

    clearData();
  }

  if (!isOpen || isAddButtonDisabled) {
    return (
      <tr>
        <td colSpan={3}>
          <button
            type="button"
            className={styles.add}
            disabled={isAddButtonDisabled}
            onClick={() => {
              setIsAutofocus(true);
              setIsOpen(true);
            }}
          >
            + Add a new item to this category
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td colSpan={3}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            type="text"
            aria-label="New item name"
            placeholder="Item name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setIsAutofocus(false)}
            autoFocus={isAutofocus}
          />
          <div className={styles.amount}>
            <button
              type="button"
              className={`${styles.sign} ${
                amount.startsWith("-") ? styles.negative : ""
              }`}
              aria-label="Toggle negative amount"
              aria-pressed={amount.startsWith("-")}
              title="Toggle +/−"
              onClick={() =>
                setAmount((a) => (a.startsWith("-") ? a.slice(1) : `-${a}`))
              }
            >
              ±
            </button>
            <input
              type="text"
              inputMode="decimal"
              className={styles.number}
              aria-label="New amount"
              placeholder="0.00"
              value={amount}
              onChange={e => {
                const raw = e.target.value;
                const amountNumber = raw.includes('-') ? `-${raw.replace(/-/g, "")}` : raw;
                setAmount(amountNumber);
              }}
            />
          </div>
          <select
            className={`${styles.account} ${
              accountId === "" ? styles.placeholder : ""
            }`}
            aria-label="Account"
            value={accountId}
            required
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="" disabled>
              Pick account
            </option>
            {accountOptions.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            aria-label="Labels"
            placeholder="Labels (comma-separated, optional)"
            value={labelsString}
            onChange={(e) => setLabelsString(e.target.value)}
          />
          <button
            type="submit"
            disabled={accountId === "" || isNaN(Number(amount))}
            className={styles.submit}
          >
            {groupedItemInEdit ? (hasChanges ? "Update" : "Keep") : "Add"}
          </button>
          {
            groupedItemInEdit
              ? <button
                type="button"
                className={styles.undo}
                disabled={!hasChanges}
                aria-label="Undo"
                title="Undo"
                onClick={() => undoChanges()}
              ><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
  <path d="M3 3v5h5"></path>
</svg></button>
              : <button
                type="button"
                className={styles.cancel}
                aria-label="Cancel"
                title="Cancel"
                onClick={() => clearData()}
              >×</button>
          }
        </form>
      </td>
    </tr>
  );
}
