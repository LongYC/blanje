import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { groupByCategory } from "../group";
import { formatCents } from "../format";
import type { Account, Category, Spending } from "../types";

interface SpendingsTableProps {
  items: Spending[];
  /** Free-form plain-text note for the month. */
  note?: string;
  categories: Category[];
  accounts: Account[];
  /**
   * Called when a spending is edited. `index` is the position within the
   * month's original `items` array; `patch` carries the changed fields.
   */
  onEditSpending?: (index: number, patch: Partial<Spending>) => void;
  /** Called when a new spending is added to a category. */
  onAddSpending?: (spending: Spending) => void;
  /** Called when the month's note is edited. */
  onEditNote?: (note: string) => void;
}

export function SpendingsTable({
  items,
  note,
  categories,
  accounts,
  onEditSpending,
  onAddSpending,
  onEditNote,
}: SpendingsTableProps) {
  const { groups, accountTotals, grandTotal } = useMemo(
    () => groupByCategory(items, categories, accounts),
    [items, categories, accounts],
  );

  return (
    <>
      <table className="spendings-table">
        <tbody>
          <tr className="grand-total-row">
            <th scope="row" colSpan={2}>
              Total
            </th>
            <td className="amount">{formatCents(grandTotal)}</td>
          </tr>
          {accountTotals.map((account) => (
            <tr key={account.accountId} className="account-total-row">
              <th scope="row" colSpan={2}>
                {account.accountName}
              </th>
              <td className="amount">{formatCents(account.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {(onEditNote || (note ?? "") !== "") && (
        <NoteField
          value={note ?? ""}
          editable={Boolean(onEditNote)}
          onChange={(v) => onEditNote?.(v)}
        />
      )}
      <table className="category-table">
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col" className="amount">
              Amount
            </th>
            <th scope="col">Account</th>
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.categoryId}>
            <tr className="category-row">
              <th scope="rowgroup">
                {group.categoryName}
                <span className="category-percent">
                  {group.percentage.toFixed(1)}%
                </span>
              </th>
              <td className="amount category-total">
                {formatCents(group.total)}
              </td>
              <td aria-label="No value"></td>
            </tr>
            {group.spendings.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={3}>No spendings</td>
              </tr>
            ) : (
              group.spendings.map((spending) => (
                <tr key={spending.index}>
                  <td>
                    {onEditSpending ? (
                      <EditableCell
                        value={spending.name}
                        display={
                          spending.name === "" ? (
                            <span className="cell-placeholder">Item name</span>
                          ) : (
                            spending.name
                          )
                        }
                        ariaLabel="Item name"
                        onChange={(name) =>
                          onEditSpending(spending.index, { name })
                        }
                      />
                    ) : (
                      spending.name
                    )}
                  </td>
                  <td className="amount">
                    {onEditSpending ? (
                      <EditableCell
                        value={spending.amount}
                        display={formatCents(spending.amountCents)}
                        ariaLabel="Amount"
                        inputMode="decimal"
                        inputClassName="cell-input amount-input"
                        onChange={(amount) =>
                          onEditSpending(spending.index, { amount })
                        }
                      />
                    ) : (
                      formatCents(spending.amountCents)
                    )}
                  </td>
                  <td>{spending.accountName}</td>
                </tr>
              ))
            )}
            {onAddSpending && (
              <AddSpendingRow
                categoryId={group.categoryId}
                accounts={accounts}
                onAdd={onAddSpending}
              />
            )}
          </tbody>
        ))}
      </table>
    </>
  );
}

interface EditableCellProps {
  /** Raw value bound to the input while editing. */
  value: string;
  /** What to render in read mode (may differ from `value`, e.g. formatted). */
  display: ReactNode;
  ariaLabel: string;
  inputMode?: "text" | "decimal";
  inputClassName?: string;
  onChange: (value: string) => void;
}

/**
 * Shows `display` as plain text by default and swaps to an input on
 * click/tap, reverting on blur. Read mode lets long values wrap so the
 * full text is visible, which a single-line input can't do in a narrow cell.
 */
function EditableCell({
  value,
  display,
  ariaLabel,
  inputMode = "text",
  inputClassName = "cell-input",
  onChange,
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button
        type="button"
        className="cell-display"
        aria-label={`Edit ${ariaLabel}`}
        onClick={() => setEditing(true)}
      >
        {display}
      </button>
    );
  }

  return (
    <input
      type="text"
      inputMode={inputMode}
      className={inputClassName}
      aria-label={ariaLabel}
      value={value}
      autoFocus
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => setEditing(false)}
      onKeyDown={(e) => {
        // Both keys leave edit mode; edits are already live via onChange.
        if (e.key === "Enter" || e.key === "Escape") {
          e.preventDefault();
          setEditing(false);
        }
      }}
    />
  );
}

interface NoteFieldProps {
  value: string;
  editable: boolean;
  onChange: (value: string) => void;
}

/**
 * A free-form, multi-line note for the month. Renders as plain text and swaps
 * to a textarea on click/tap when editable, committing edits live via onChange
 * and reverting to read mode on blur.
 */
function NoteField({ value, editable, onChange }: NoteFieldProps) {
  const [editing, setEditing] = useState(false);

  if (!editable) {
    return value === "" ? null : <p className="month-note">{value}</p>;
  }

  if (!editing) {
    return (
      <button
        type="button"
        className="month-note month-note-display"
        aria-label="Edit note"
        onClick={() => setEditing(true)}
      >
        {value === "" ? (
          <span className="cell-placeholder">Add a note</span>
        ) : (
          value
        )}
      </button>
    );
  }

  return (
    <textarea
      className="month-note month-note-input"
      aria-label="Note"
      value={value}
      autoFocus
      rows={3}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => setEditing(false)}
      onKeyDown={(e) => {
        // Escape leaves edit mode; Enter inserts a newline (multi-line note).
        if (e.key === "Escape") {
          e.preventDefault();
          setEditing(false);
        }
      }}
    />
  );
}

interface AddSpendingRowProps {
  categoryId: string;
  accounts: Account[];
  onAdd: (spending: Spending) => void;
}

/** A per-category row that expands into a form for adding a new spending. */
function AddSpendingRow({ categoryId, accounts, onAdd }: AddSpendingRowProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");

  function reset() {
    setName("");
    setAmount("");
    setAccountId(accounts[0]?.id ?? "");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (name.trim() === "" || amount.trim() === "" || Number.isNaN(Number(amount))) {
      return;
    }
    onAdd({ categoryId, name: name.trim(), amount: amount.trim(), accountId });
    // Keep the form open for quick consecutive entries.
    setName("");
    setAmount("");
  }

  if (!open) {
    return (
      <tr className="add-row">
        <td colSpan={3}>
          <button
            type="button"
            className="add-toggle"
            onClick={() => setOpen(true)}
          >
            + Add item
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="add-row">
      <td colSpan={3}>
        <form className="add-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="cell-input"
            aria-label="New item name"
            placeholder="Item name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <select
            className="cell-input account-select"
            aria-label="Account"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            inputMode="decimal"
            className="cell-input amount-input"
            aria-label="New amount"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button type="submit">Add</button>
          <button
            type="button"
            className="clear-btn"
            onClick={() => {
              setOpen(false);
              reset();
            }}
          >
            Done
          </button>
        </form>
      </td>
    </tr>
  );
}
