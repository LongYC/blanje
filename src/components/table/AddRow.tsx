import { useState, type SubmitEvent } from "react";
import type { Account, Spending } from "../../types";
import styles from "./AddRow.module.css";

interface AddRowProps {
  categoryId: string;
  accounts: Account[];
  onAdd: (spending: Spending) => void;
}

export function AddRow({ categoryId, accounts, onAdd }: AddRowProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");

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
    onAdd({ categoryId, name: name.trim(), amount: amount.trim(), accountId });
    setName("");
    setAmount("");
    setAccountId("");
  }

  if (!open) {
    return (
      <tr>
        <td colSpan={3}>
          <button
            type="button"
            className={styles.show}
            onClick={() => setOpen(true)}
          >
            + Add item
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
            autoFocus
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
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          <button type="submit" disabled={accountId === ""}>
            Add
          </button>
          <button
            type="button"
            className={styles.close}
            aria-label="Close"
            title="Close"
            onClick={() => {
              setOpen(false);
              reset();
            }}
          >
            ×
          </button>
        </form>
      </td>
    </tr>
  );
}
