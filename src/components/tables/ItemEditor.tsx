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
  onSubmit: (item: Item) => void;
  onClose?: () => void;
}

export function ItemEditor({
  categoryId,
  accountOptions,
  isOpenByDefault = false,
  groupedItemInEdit,
  isAddButtonDisabled = false,
  onSubmit,
  onClose
}: ItemEditorProps) {
  const [isOpen, setIsOpen] = useState(isOpenByDefault);
  const [isAutofocus, setIsAutofocus] = useState(true);
  const [name, setName] = useState(groupedItemInEdit?.name ?? "");
  const [amount, setAmount] = useState(groupedItemInEdit?.amount ?? "");
  const [accountId, setAccountId] = useState(groupedItemInEdit?.accountId ?? "");

  function reset() {
    setName("");
    setAmount("");
    setAccountId("");
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (
      name.trim() === "" ||
      amount.trim() === "" ||
      Number.isNaN(Number(amount)) ||
      accountId === ""
    ) {
      return;
    }
    onSubmit({
      categoryId,
      name: name.trim(),
      amount: amount.trim(),
      accountId
    });
    reset();
  }

  if (!isOpen || isAddButtonDisabled) {
    return (
      <tr>
        <td colSpan={3}>
          <button
            type="button"
            className={styles.show}
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
            className={styles.input}
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
              className={`${styles.input} ${styles.number}`}
              aria-label="New amount"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <select
            className={`${styles.input} ${styles.account} ${
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
          <button
            type="submit"
            disabled={accountId === ""}
          >
            {groupedItemInEdit ? "Update" : "Add"}
          </button>
          <button
            type="button"
            className={styles.close}
            aria-label="Close"
            title="Close"
            onClick={() => {
              setIsOpen(false);
              reset();
              onClose?.();
            }}
          >
            ×
          </button>
        </form>
      </td>
    </tr>
  );
}
